import { receipts as receiptTable, expensesForYear } from '@/lib/repository';
import { resolveYear } from '@/lib/year';
import { formatBytes, formatDate, formatMoney } from '@/lib/format';
import { ViewerNotice, PageHeader, EmptyState, ErrorNotice } from '@/components/ui/primitives';
import { ReceiptUploadPanel } from '@/components/receipt-upload-panel';
import { currentUser, canEdit, canViewReceipts } from '@/lib/auth';
import { redactReceipt } from '@/lib/redact';

export const dynamic = 'force-dynamic';

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const year = resolveYear((await searchParams).year);
  const member = await currentUser();
  const role = member?.role ?? 'viewer';
  const editable = canEdit(role);
  const canSeeFiles = canViewReceipts(role, member?.email);

  let rows, expenseRows;
  try {
    [rows, expenseRows] = await Promise.all([receiptTable.list(), expensesForYear(year)]);
  } catch (error) {
    return <ErrorNotice message={error instanceof Error ? error.message : 'Unknown error.'} />;
  }

  const forYear = rows
    .filter((row) => row.year === year)
    .map((row) => redactReceipt(row, role, member?.email))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const expenseName = new Map(expenseRows.map((row) => [row.id, row.description]));
  const totalSize = forYear.reduce((sum, row) => sum + row.sizeBytes, 0);
  const attached = new Set(forYear.map((row) => row.expenseId).filter(Boolean));
  const missing = expenseRows.filter(
    (row) => row.settlement !== 'Paid directly' && !attached.has(row.id),
  );

  return (
    <>
      <PageHeader
        title="Receipts"
        subtitle={`${year} · ${forYear.length} files · ${formatBytes(totalSize)} in Drive`}
      />

      {!editable ? <ViewerNotice /> : null}

      {editable && missing.length > 0 ? (
        <div className="card mb-6 border-accent/25 bg-accent/5 p-4">
          <p className="text-sm text-ink">
            <span className="font-medium">{missing.length}</span> of {expenseRows.length} expenses
            have no receipt attached, totalling{' '}
            <span className="font-medium tabular-nums">
              {formatMoney(missing.reduce((sum, row) => sum + row.amount, 0))}
            </span>
            .
          </p>
        </div>
      ) : null}

      {editable ? (
        <div className="mb-8">
          <ReceiptUploadPanel
            year={year}
            expenses={expenseRows.map((row) => ({ id: row.id, label: row.description }))}
          />
        </div>
      ) : null}

      {forYear.length === 0 ? (
        <EmptyState
          title={`No receipts uploaded for ${year}`}
          description={
            editable
              ? "Upload bills and receipts here, or attach them directly when recording an expense. They are stored privately in the committee's Drive folder."
              : 'Receipts uploaded by the committee will appear here.'
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forYear.map((receipt) => {
            const isImage = receipt.mimeType.startsWith('image/');
            const preview = (
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-raised">
                {!canSeeFiles ? (
                  <div className="px-4 text-center">
                    <span className="text-3xl" aria-hidden>
                      🔒
                    </span>
                    <p className="mt-2 text-xs text-faint">Committee members only</p>
                  </div>
                ) : isImage ? (
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
            );

            return (
              <li key={receipt.id} className="card group overflow-hidden">
                {canSeeFiles ? (
                  <a
                    href={`/api/receipts/${receipt.fileId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    {preview}
                  </a>
                ) : (
                  preview
                )}
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
