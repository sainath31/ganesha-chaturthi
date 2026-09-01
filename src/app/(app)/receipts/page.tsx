import { receipts as receiptTable, expensesForYear } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatBytes, formatDate } from '@/lib/format';
import { PageHeader, EmptyState, ErrorNotice } from '@/components/ui/primitives';
import { ReceiptUploadPanel } from '@/components/receipt-upload-panel';

export const dynamic = 'force-dynamic';

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const year = resolveYear((await searchParams).year);

  let rows, expenseRows;
  try {
    [rows, expenseRows] = await Promise.all([receiptTable.list(), expensesForYear(year)]);
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  const forYear = rows
    .filter((row) => row.year === year)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const expenseName = new Map(expenseRows.map((row) => [row.id, row.description]));
  const totalSize = forYear.reduce((sum, row) => sum + row.sizeBytes, 0);

  return (
    <>
      <PageHeader
        title="Receipts"
        subtitle={`${year} · ${forYear.length} files · ${formatBytes(totalSize)} in Drive`}
      />

      <div className="mb-8">
        <ReceiptUploadPanel
          year={year}
          expenses={expenseRows.map((row) => ({ id: row.id, label: row.description }))}
        />
      </div>

      {forYear.length === 0 ? (
        <EmptyState
          title={`No receipts uploaded for ${year}`}
          description="Upload bills and receipts here, or attach them directly when recording an expense. They are stored privately in the committee's Drive folder."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forYear.map((receipt) => {
            const isImage = receipt.mimeType.startsWith('image/');
            return (
              <li key={receipt.id} className="card group overflow-hidden">
                <a
                  href={`/api/receipts/${receipt.fileId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-raised">
                    {isImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={`/api/receipts/${receipt.fileId}`}
                        alt={receipt.fileName}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="text-4xl" aria-hidden>
                        📄
                      </span>
                    )}
                  </div>
                </a>
                <div className="p-4">
                  <p className="truncate text-sm font-medium text-ink">{receipt.fileName}</p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {receipt.expenseId
                      ? (expenseName.get(receipt.expenseId) ?? 'Linked expense')
                      : 'Unattached'}
                  </p>
                  <p className="mt-2 text-xs text-faint">
                    {formatBytes(receipt.sizeBytes)} ·{' '}
                    {receipt.uploadedAt ? formatDate(receipt.uploadedAt.slice(0, 10)) : '—'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
