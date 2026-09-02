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
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
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
  tone?: 'neutral' | 'positive' | 'negative' | 'brand' | 'accent';
}) {
  const toneClass = {
    neutral: 'text-ink',
    positive: 'text-positive',
    negative: 'text-negative',
    brand: 'text-brand',
    // Dedicated to "spent/expenses" specifically, so it matches the Balance
    // meter's Spent bar and the category breakdown chart — not to be reused
    // for anything else, or the same inconsistency creeps back in.
    accent: 'text-accent',
  }[tone];

  return (
    <div className="card p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-faint sm:text-xs">
        {label}
      </p>
      <p className={`mt-2 font-display text-2xl font-semibold tabular-nums sm:text-3xl ${toneClass}`}>
        {value}
      </p>
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

/**
 * Tone is semantic, not decorative — keep it consistent with the same
 * concept everywhere it shows up: positive for money received/settled/
 * cleared, negative for pending/outstanding, brand only for a neutral
 * highlight that isn't "good" or "bad" (e.g. a plain status label).
 */
export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'brand' | 'positive' | 'negative';
}) {
  const toneClass = {
    neutral: 'bg-raised text-muted',
    brand: 'bg-brand/10 text-brand',
    positive: 'bg-positive/10 text-positive',
    negative: 'bg-negative/10 text-negative',
  }[tone];
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

export function ViewerNotice() {
  return (
    <div className="card mb-6 flex items-start gap-3 border-brand/20 bg-brand/5 p-4">
      <span aria-hidden className="text-base leading-none">
        🔒
      </span>
      <p className="text-sm text-muted">
        You are viewing the public summary. Household names are shortened and lanes, notes and
        receipt images are hidden.{' '}
        <a href="/signin" className="font-medium text-brand underline underline-offset-2">
          Sign in
        </a>{' '}
        to see full details.
      </p>
    </div>
  );
}
