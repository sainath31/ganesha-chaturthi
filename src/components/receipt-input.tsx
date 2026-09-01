'use client';

import { useRef, useState } from 'react';

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 2000;

/**
 * Drag-and-drop receipt picker. Photos are downscaled and re-encoded in the
 * browser before they ever reach the server: a modern phone camera produces
 * 4-8 MB files that would otherwise crowd the server action's body limit and
 * the committee's Drive quota, and a receipt is perfectly readable at 2000px.
 */
export function ReceiptInput({ name }: { name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept(incoming: FileList | null) {
    if (!incoming?.length) return;
    setWorking(true);
    setError(null);

    const processed: File[] = [];
    for (const file of Array.from(incoming)) {
      try {
        const compressed = file.type.startsWith('image/') ? await compress(file) : file;
        if (compressed.size > MAX_BYTES) {
          setError(`"${file.name}" is still over 10 MB after compression.`);
          continue;
        }
        processed.push(compressed);
      } catch {
        // A format the browser cannot decode (HEIC on some desktops) still
        // uploads fine as-is, so fall back rather than dropping the file.
        if (file.size <= MAX_BYTES) processed.push(file);
        else setError(`"${file.name}" is larger than 10 MB.`);
      }
    }

    const next = [...files, ...processed];
    setFiles(next);
    syncInput(next);
    setWorking(false);
  }

  function syncInput(next: File[]) {
    if (!inputRef.current) return;
    const transfer = new DataTransfer();
    for (const file of next) transfer.items.add(file);
    inputRef.current.files = transfer.files;
  }

  function remove(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncInput(next);
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void accept(event.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
          dragging ? 'border-brand bg-brand/5' : 'border-line bg-raised/40'
        }`}
      >
        <p className="text-sm text-muted">
          Drag receipts here, or{' '}
          <button
            type="button"
            className="font-medium text-brand underline underline-offset-2"
            onClick={() => inputRef.current?.click()}
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-xs text-faint">JPG, PNG or PDF · up to 10 MB each</p>
        <input
          ref={inputRef}
          type="file"
          name={name}
          multiple
          accept="image/*,application/pdf"
          capture="environment"
          className="sr-only"
          onChange={(event) => void accept(event.target.files)}
        />
      </div>

      {working ? <p className="mt-2 text-xs text-muted">Preparing images…</p> : null}
      {error ? <p className="mt-2 text-xs text-negative">{error}</p> : null}

      {files.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-2"
            >
              <span className="truncate text-xs text-ink">{file.name}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-xs tabular-nums text-faint">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-xs text-muted hover:text-negative"
                  aria-label={`Remove ${file.name}`}
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

async function compress(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No canvas context');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.82),
  );
  if (!blob) throw new Error('Could not encode image');

  // Keep the original if compression made it bigger (already-small images).
  if (blob.size >= file.size) return file;

  const renamed = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], renamed, { type: 'image/jpeg' });
}
