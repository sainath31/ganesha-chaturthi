'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    // Focus the panel so screen readers announce the dialog and Escape works
    // without the user first clicking inside it.
    panel.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  if (!mounted) return null;

  /*
   * Rendered into document.body rather than in place. The dialog is opened from
   * a table cell inside <main>, which carries a page-entry animation; a
   * transform on any ancestor makes position:fixed resolve against that
   * ancestor instead of the viewport, which left the dialog scrolled under the
   * header on small screens.
   */
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        /* text-left is deliberate: the dialog is rendered from inside a
           right-aligned table cell, whose alignment it would otherwise
           inherit and apply to every label in the form. */
        className="enter max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-line bg-surface text-left shadow-lift outline-none sm:rounded-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-line bg-surface px-6 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
