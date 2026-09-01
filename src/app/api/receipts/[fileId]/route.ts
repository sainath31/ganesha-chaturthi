import { auth } from '@/lib/auth';
import { fetchReceiptBytes } from '@/lib/drive';

/**
 * Receipts stay private in Drive — nothing is shared "anyone with the link".
 * Signed-in committee members read them through this proxy instead.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Not authorised', { status: 401 });
  }

  const { fileId } = await params;
  try {
    const { body, mimeType } = await fetchReceiptBytes(fileId);
    return new Response(body, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': 'inline',
      },
    });
  } catch {
    return new Response('Receipt not found', { status: 404 });
  }
}
