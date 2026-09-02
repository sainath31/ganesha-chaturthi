import { currentUser, canViewReceipts } from '@/lib/auth';
import { fetchReceiptBytes } from '@/lib/drive';

/**
 * Receipt files are never shared "anyone with the link" in Drive — they are
 * only reachable through this proxy.
 *
 * Unlike the figures, the images are withheld from public viewers entirely: a
 * photographed bill can carry a card number, a signature or a home address,
 * and no field-level redaction can reach inside a JPEG.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const user = await currentUser();
  if (!canViewReceipts(user?.role ?? 'viewer', user?.email)) {
    return new Response('Receipts are visible to authorised committee members only.', {
      status: 403,
    });
  }

  const { fileId } = await params;
  try {
    const { body, mimeType } = await fetchReceiptBytes(fileId);
    return new Response(body, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, no-store',
        'Content-Disposition': 'inline',
      },
    });
  } catch {
    return new Response('Receipt not found', { status: 404 });
  }
}
