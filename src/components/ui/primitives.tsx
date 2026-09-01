import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'positive' | 'negative' | 'brand';
}) {
  const toneClass = {
    neutral: 'text-ink',
    positive: 'text-positive',
    negative: 'text-negative',
    brand: 'text-brand',
  }[tone];

  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div aria-hidden className="text-4xl">🪔</div>
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'brand' }) {
  const toneClass =
    tone === 'brand' ? 'bg-brand/10 text-brand' : 'bg-raised text-muted';
  return (
    <span className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="card border-negative/30 bg-negative/5 p-5">
      <h2 className="font-display text-base font-semibold text-negative">Could not load data</h2>
      <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted">{message}</p>
    </div>
  );
}
