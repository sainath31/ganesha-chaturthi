import { HeaderSkeleton } from '@/components/ui/skeletons';

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index} className="card overflow-hidden">
            <div className="skeleton aspect-[4/3] rounded-none" />
            <div className="p-4">
              <div className="skeleton h-3.5 w-3/4" />
              <div className="skeleton mt-2 h-3 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
