import { HeaderSkeleton, TableSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="mt-6">
        <TableSkeleton />
      </div>
    </>
  );
}
