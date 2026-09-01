import { HeaderSkeleton, StatRowSkeleton, TableSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <StatRowSkeleton />
      <div className="mt-6">
        <TableSkeleton />
      </div>
    </>
  );
}
