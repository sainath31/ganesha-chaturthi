'use client';

/** Purely local, controlled input — filtering happens client-side against
 *  rows already on the page, so typing never triggers a navigation (which
 *  previously remounted the list and dropped focus on every keystroke). */
export function SearchBox({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="field sm:max-w-xs"
    />
  );
}
