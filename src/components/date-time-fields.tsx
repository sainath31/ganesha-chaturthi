'use client';

import { useEffect, useRef, useState } from 'react';

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

/** First and last day of this year's festival — nothing outside this range
 *  makes sense to record or RSVP for. Update these each year. */
export const FESTIVAL_START_DATE = '2026-09-14';
export const FESTIVAL_END_DATE = '2026-09-20';

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
  minDate,
  maxDate,
  span,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  /** ISO dates (YYYY-MM-DD) bounding what can be picked — options outside
   *  the range are left out of the dropdowns entirely, rather than shown
   *  and rejected on submit. */
  minDate?: string;
  maxDate?: string;
  span?: boolean;
}) {
  const initial = parseIsoDate(defaultValue);
  const min = minDate ? parseIsoDate(minDate) : null;
  const max = maxDate ? parseIsoDate(maxDate) : null;
  const clampYear = (y: number) => {
    if (min) y = Math.max(y, min.year);
    if (max) y = Math.min(y, max.year);
    return y;
  };
  const [year, setYear] = useState(clampYear(initial.year));
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  const lowMonth = min && year === min.year ? min.month : 1;
  const highMonth = max && year === max.year ? max.month : 12;
  const monthsAllowed = MONTHS.slice(lowMonth - 1, highMonth);
  const clampedMonth = Math.min(Math.max(month, lowMonth), highMonth);

  const daysInMonth = new Date(year, clampedMonth, 0).getDate();
  const lowDay = min && year === min.year && clampedMonth === min.month ? min.day : 1;
  const highDay = max && year === max.year && clampedMonth === max.month ? max.day : daysInMonth;
  const clampedDay = Math.min(Math.max(day, lowDay), highDay);
  const daysAllowed = Array.from({ length: highDay - lowDay + 1 }, (_, i) => lowDay + i);

  const value = `${year}-${pad(clampedMonth)}-${pad(clampedDay)}`;
  // The festival only spans one year at a time, so there's nothing useful to
  // pick here — just the one year that's already selected (today's, or an
  // existing record's).
  const years = [year];

  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label={`${label} — month`}
          className="field min-w-0"
          value={clampedMonth}
          onChange={(event) => setMonth(Number(event.target.value))}
        >
          {monthsAllowed.map((m, i) => (
            <option key={m} value={lowMonth + i}>
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
          {daysAllowed.map((d) => (
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

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = [0, 15, 30, 45];
const PERIODS = ['AM', 'PM'] as const;
type Period = (typeof PERIODS)[number];

function to24Hour(hour12: number, period: Period): number {
  const h = hour12 % 12;
  return period === 'PM' ? h + 12 : h;
}

export function TimeField({
  label,
  name,
  defaultValue,
  autoPeriod,
  span,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  /** Suggests AM/PM from context (e.g. the Session picked alongside this
   *  field) — applied whenever it changes, unless the user has already
   *  picked AM/PM here themselves. */
  autoPeriod?: Period;
  span?: boolean;
}) {
  const match = defaultValue && /^\d{2}:\d{2}$/.test(defaultValue) ? defaultValue : null;
  const initialHour24 = match ? Number(match.slice(0, 2)) : 9;
  const [hour12, setHour12] = useState(initialHour24 % 12 === 0 ? 12 : initialHour24 % 12);
  const [minute, setMinute] = useState(match ? Number(match.slice(3, 5)) : 0);
  const [period, setPeriod] = useState<Period>(
    autoPeriod ?? (initialHour24 < 12 ? 'AM' : 'PM'),
  );
  const touchedPeriod = useRef(Boolean(match)); // an existing time already fixes AM/PM

  useEffect(() => {
    if (!touchedPeriod.current && autoPeriod) setPeriod(autoPeriod);
  }, [autoPeriod]);

  const value = `${pad(to24Hour(hour12, period))}:${pad(minute)}`;

  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-3 gap-2">
        <select
          aria-label={`${label} — hour`}
          className="field min-w-0"
          value={hour12}
          onChange={(event) => setHour12(Number(event.target.value))}
        >
          {HOURS_12.map((h) => (
            <option key={h} value={h}>
              {h}
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
        <select
          aria-label={`${label} — AM or PM`}
          className="field min-w-0"
          value={period}
          onChange={(event) => {
            touchedPeriod.current = true;
            setPeriod(event.target.value as Period);
          }}
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
