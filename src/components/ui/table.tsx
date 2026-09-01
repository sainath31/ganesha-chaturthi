import type { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, align }: { children?: ReactNode; align?: 'right' }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-faint ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = '',
  align,
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  align?: 'right';
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`px-4 py-3 ${align === 'right' ? 'text-right' : ''} ${className}`}
    >
      {children}
    </td>
  );
}
