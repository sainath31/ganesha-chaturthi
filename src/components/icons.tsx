import type { CSSProperties } from 'react';

type IconProps = { className?: string; style?: CSSProperties };

const base = 'h-5 w-5';

export function DashboardIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2" />
      <rect x="13" y="3.5" width="7.5" height="4.8" rx="2" />
      <rect x="13" y="10.7" width="7.5" height="9.8" rx="2" />
      <rect x="3.5" y="13.2" width="7.5" height="7.3" rx="2" />
    </svg>
  );
}

export function DonationIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path d="M12 20.2s-7.2-4.4-9.4-8.9C1.2 8 2.7 4.9 5.9 4.3c1.9-.3 3.7.6 4.8 2.2l1.3 1.9 1.3-1.9c1.1-1.6 2.9-2.5 4.8-2.2 3.2.6 4.7 3.7 3.3 7-2.2 4.5-9.4 8.9-9.4 8.9Z" />
    </svg>
  );
}

export function ExpenseIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
      <path d="M16.5 15h2.5" />
    </svg>
  );
}

export function ReceiptIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path d="M6 2.8h12v18.4l-2.4-1.6-2.1 1.6-2-1.6-2 1.6-2.1-1.6L6 21.2Z" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" />
    </svg>
  );
}

export function ReportIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path d="M4 20V10M12 20V4M20 20v-7" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function RsvpIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M15.5 4.8a3 3 0 0 1 0 5.9" />
      <path d="M17.5 14.7c2.4.4 3.9 2.3 3.9 5.3" />
      <path d="M14.5 4.2 16 5.7l2.7-2.9" />
    </svg>
  );
}

export function SignOutIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className} aria-hidden>
      <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
      <path d="M16.5 16.5 21 12l-4.5-4.5" />
      <path d="M21 12H9" />
    </svg>
  );
}
