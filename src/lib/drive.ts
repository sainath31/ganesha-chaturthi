import { Readable } from 'node:stream';
import { driveClient } from './google';
import { env } from './env';

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;

export const ALLOWED_RECEIPT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

export type UploadedFile = {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  webViewLink: string;
};

/**
 * Uploads into a year subfolder of the configured receipts folder, so the Drive
 * folder stays navigable by hand after several festivals.
 */
export async function uploadReceipt(
  file: File,
  options: { year?: number } = {},
): Promise<UploadedFile> {
  if (file.size > MAX_RECEIPT_BYTES) {
    throw new Error(`"${file.name}" is larger than the 10 MB limit.`);
  }
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type as (typeof ALLOWED_RECEIPT_TYPES)[number])) {
    throw new Error(`"${file.name}" is a ${file.type || 'unknown'} file. Upload a JPG, PNG, or PDF.`);
  }

  const drive = driveClient();
  const parent = await ensureYearFolder(options.year ?? new Date().getFullYear());
  const buffer = Buffer.from(await file.arrayBuffer());

  const created = await drive.files.create({
    requestBody: {
      name: `${new Date().toISOString().slice(0, 10)} ${file.name}`,
      parents: [parent],
    },
    media: { mimeType: file.type, body: Readable.from(buffer) },
    fields: 'id, name, mimeType, size, webViewLink',
  });

  const { id, name, mimeType, size, webViewLink } = created.data;
  if (!id) throw new Error('Drive did not return a file ID for the upload.');

  return {
    fileId: id,
    fileName: name ?? file.name,
    mimeType: mimeType ?? file.type,
    sizeBytes: Number(size ?? file.size),
    webViewLink: webViewLink ?? '',
  };
}

const folderCache = new Map<number, string>();

async function ensureYearFolder(year: number): Promise<string> {
  const cachedId = folderCache.get(year);
  if (cachedId) return cachedId;

  const drive = driveClient();
  const name = String(year);
  const query = [
    `'${env.receiptsFolderId}' in parents`,
    `name = '${name}'`,
    "mimeType = 'application/vnd.google-apps.folder'",
    'trashed = false',
  ].join(' and ');

  const existing = await drive.files.list({ q: query, fields: 'files(id)', pageSize: 1 });
  let id = existing.data.files?.[0]?.id ?? undefined;

  if (!id) {
    const created = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [env.receiptsFolderId],
      },
      fields: 'id',
    });
    id = created.data.id ?? undefined;
  }

  if (!id) throw new Error(`Could not create the ${year} folder in Drive.`);
  folderCache.set(year, id);
  return id;
}

/** Streams a file's bytes back through our own server so it stays private in Drive. */
export async function fetchReceiptBytes(
  fileId: string,
): Promise<{ body: ArrayBuffer; mimeType: string }> {
  const drive = driveClient();
  const meta = await drive.files.get({ fileId, fields: 'mimeType' });
  const content = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' },
  );
  return {
    body: content.data as ArrayBuffer,
    mimeType: meta.data.mimeType ?? 'application/octet-stream',
  };
}

export async function deleteReceiptFile(fileId: string): Promise<void> {
  await driveClient().files.update({ fileId, requestBody: { trashed: true } });
}
