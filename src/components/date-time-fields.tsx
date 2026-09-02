'use client';

import { useState } from 'react';

/**
 * Replaces the browser's native <input type="date">/<input type="time">.
 * Those widgets are rendered by the OS on phones (a real iOS/Android date
 * picker, not plain HTML), with an internal minimum size that CSS width,
 * max-width and even overflow:hidden can only partially control — confirmed
 * on real devices where every other field fit but these didn't. Built from
 * plain <select> elements instead: no OS-native rendering involved, so no
 * device-dependent sizing left to fight. The combined value is kept in a
 * hidden input, so server actions read formData.get(name) exactly as before.
 */

// Short names: the month select is only a third of the field's width, and
// full names like "September" truncate mid-word there.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parseIsoDate(value: string | undefined): { year: number; month: number; day: number } {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return { year: y, month: m, day: d };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

export function DateField({
  label,
  name,
  defaultValue,
  span,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  span?: boolean;
}) {
  const initial = parseIsoDate(defaultValue);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  const daysInMonth = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, daysInMonth);
  const value = `${year}-${pad(month)}-${pad(clampedDay)}`;
  const years = Array.from({ length: 6 }, (_, i) => initial.year - 1 + i);

  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label={`${label} — month`}
          className="field min-w-0"
          value={month}
          onChange={(event) => setMonth(Number(event.target.value))}
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} — day`}
          className="field min-w-0"
          value={clampedDay}
          onChange={(event) => setDay(Number(event.target.value))}
        >
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} — year`}
          className="field min-w-0"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export function TimeField({
  label,
  name,
  defaultValue,
  span,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  span?: boolean;
}) {
  const match = defaultValue && /^\d{2}:\d{2}$/.test(defaultValue) ? defaultValue : null;
  const [hour, setHour] = useState(match ? Number(match.slice(0, 2)) : 9);
  const [minute, setMinute] = useState(match ? Number(match.slice(3, 5)) : 0);

  const value = `${pad(hour)}:${pad(minute)}`;

  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label={`${label} — hour`}
          className="field min-w-0"
          value={hour}
          onChange={(event) => setHour(Number(event.target.value))}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h % 12 === 0 ? 12 : h % 12} {h < 12 ? 'AM' : 'PM'}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} — minute`}
          className="field min-w-0"
          value={minute}
          onChange={(event) => setMinute(Number(event.target.value))}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              :{pad(m)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
