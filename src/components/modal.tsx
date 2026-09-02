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
      className="fixed inset-0 z-50 flex h-[100dvh] items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
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
        /* flex-col with a shrink-0 header + independently scrolling body,
           rather than a sticky header inside one scrolling box: iOS Safari
           has long-standing bugs where `position: sticky` fails to stick
           inside a `position: fixed` ancestor, which silently dropped the
           header (and made the body appear un-scrollable) on phones.
           max-h uses dvh (dynamic viewport height), not vh: on real phones,
           `vh` is based on the layout viewport, which can be taller than
           what's actually visible once the browser's address bar is
           accounted for, sizing the panel — and pushing its own header
           above the visible screen — using the wrong, larger height.
           text-left is deliberate: the dialog is rendered from inside a
           right-aligned table cell, whose alignment it would otherwise
           inherit and apply to every label in the form. */
        className="enter flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl border border-line bg-surface text-left shadow-lift outline-none sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-6 py-4">
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
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
