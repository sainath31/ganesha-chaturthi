'use client';

export function PrintButton() {
  return (
    <button type="button" className="btn-ghost print:hidden" onClick={() => window.print()}>
      Print statement
    </button>
  );
}
