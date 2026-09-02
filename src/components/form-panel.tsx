'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/actions';
import { useToast } from './toast';

/**
 * A disclosure panel wrapping a server action. Kept deliberately plain rather
 * than a modal: on a phone, mid-festival, a form that pushes the page down is
 * easier to use than one that traps focus.
 */
export function FormPanel({
  title,
  openLabel,
  submitLabel,
  action,
  children,
}: {
  title: string;
  openLabel: string;
  submitLabel: string;
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toast = useToast();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);

    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) {
        form.reset();
        setOpen(false);
        toast(`${title} saved.`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        {openLabel}
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card w-full p-6">
      <h2 className="mb-5 font-display text-lg font-semibold">{title}</h2>

      <div className="grid gap-4 sm:grid-cols-2">{children}</div>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-negative/10 px-3 py-2 text-sm text-negative">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex gap-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function Field({
  label,
  name,
  type = 'text',
  required,
  defaultValue,
  placeholder,
  span,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  span?: boolean;
  step?: string;
}) {
  return (
    // min-w-0 overrides the grid item's default min-width:auto — without it,
    // a date/time input's native internal content can force this cell (and
    // the row) wider than the container, overflowing the form on phones.
    <div className={`min-w-0 ${span ? 'sm:col-span-2' : ''}`}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="field min-w-0"
      />
    </div>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={defaultValue} className="field min-w-0">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
