export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card p-5">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton mt-3 h-8 w-28" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line bg-raised/60 px-4 py-3">
        <div className="skeleton h-3 w-32" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3.5">
            <div className="skeleton h-3.5 flex-1" style={{ maxWidth: `${40 + (index % 3) * 15}%` }} />
            <div className="skeleton ml-auto h-3.5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="mb-8">
      <div className="skeleton h-8 w-56" />
      <div className="skeleton mt-2.5 h-3.5 w-72" />
    </div>
  );
}
