"use client";

import { useEffect, useRef, useState } from "react";

type DateRangePickerProps = {
  name?: string;
  label?: string;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatShort(d: Date) {
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

function formatRange(start: Date, end: Date) {
  return `${formatShort(start)} – ${formatShort(end)}, ${end.getFullYear()}`;
}

function buildMonthDays(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const mIdx = month.getMonth();
  const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
  const leadingBlanks = new Date(year, mIdx, 1).getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, mIdx, d));
  return days;
}

export default function DateRangePicker({ name = "dates", label = "Preferred dates" }: DateRangePickerProps) {
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function handleDayClick(day: Date) {
    if (day.getTime() < today.getTime()) return;

    if (!rangeStart || rangeEnd) {
      setRangeStart(day);
      setRangeEnd(null);
      return;
    }

    if (day.getTime() <= rangeStart.getTime()) {
      setRangeStart(day);
      setRangeEnd(null);
      return;
    }

    setRangeEnd(day);
    setIsOpen(false);
  }

  function changeMonth(delta: number) {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  const days = buildMonthDays(viewMonth);
  const previewEnd = rangeEnd || hoverDate;
  const isPrevDisabled = viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() === today.getMonth();

  const triggerLabel = rangeStart
    ? rangeEnd
      ? formatRange(rangeStart, rangeEnd)
      : `${formatShort(rangeStart)} – select end date`
    : "Select dates";

  return (
    <div className="field date-range-field" ref={wrapRef}>
      <label htmlFor={`${name}-trigger`}>{label}</label>
      <button
        type="button"
        id={`${name}-trigger`}
        className="date-range-trigger"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {triggerLabel}
      </button>
      <input type="hidden" name={name} value={rangeStart && rangeEnd ? formatRange(rangeStart, rangeEnd) : ""} />

      {isOpen && (
        <div className="date-range-popover" role="dialog" aria-label="Choose date range">
          <div className="drp-header">
            <button
              type="button"
              aria-label="Previous month"
              disabled={isPrevDisabled}
              onClick={() => changeMonth(-1)}
            >
              &#8249;
            </button>
            <span>
              {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>
              &#8250;
            </button>
          </div>
          <div className="drp-daynames">
            {DAY_LABELS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="drp-grid" onMouseLeave={() => setHoverDate(null)}>
            {days.map((day, i) => {
              if (!day) return <span key={`blank-${i}`} className="drp-blank" />;
              const isPast = day.getTime() < today.getTime();
              const isStart = !!rangeStart && day.getTime() === rangeStart.getTime();
              const isEnd = !!rangeEnd && day.getTime() === rangeEnd.getTime();
              const inRange =
                !!rangeStart &&
                !!previewEnd &&
                day.getTime() > rangeStart.getTime() &&
                day.getTime() < previewEnd.getTime();
              const classNames = [
                "drp-day",
                isStart && "is-start",
                isEnd && "is-end",
                inRange && "in-range",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  disabled={isPast}
                  className={classNames}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => rangeStart && !rangeEnd && setHoverDate(day)}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
