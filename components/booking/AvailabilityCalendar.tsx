"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, eachDay, occupiedRange, pickupDate } from "@/lib/dates";

interface Props {
  startDate: string | null;
  nights: number;
  earliest: string;
  latest: string;
  unavailable: Set<string>;
  loadingMonths: boolean;
  onMonthChange: (monthStartIso: string) => void;
  onSelect: (iso: string) => void;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const DAY_LABEL = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });

function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}
function shiftMonth(first: string, delta: number): string {
  const d = new Date(`${first}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 10);
}

export default function AvailabilityCalendar({
  startDate,
  nights,
  earliest,
  latest,
  unavailable,
  loadingMonths,
  onMonthChange,
  onSelect,
}: Props) {
  const [month, setMonth] = useState(() => monthStart(startDate ?? earliest));

  useEffect(() => {
    onMonthChange(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const end = startDate ? pickupDate(startDate, nights) : null;
  const occupied = startDate && end ? occupiedRange(startDate, end) : null;
  const conflictDays = useMemo(() => {
    if (!occupied) return new Set<string>();
    return new Set(eachDay(occupied.from, occupied.to).filter((d) => unavailable.has(d)));
  }, [occupied?.from, occupied?.to, unavailable]); // eslint-disable-line react-hooks/exhaustive-deps

  const cells = useMemo(() => {
    const first = new Date(`${month}T00:00:00Z`);
    const lead = first.getUTCDay();
    const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let i = 0; i < daysInMonth; i++) out.push(addDays(month, i));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [month]);

  const canPrev = month > monthStart(earliest);
  const canNext = shiftMonth(month, 1) <= latest;

  return (
    <div className="bk-cal" aria-busy={loadingMonths}>
      <div className="bk-cal-head">
        <button type="button" className="bk-cal-nav" onClick={() => setMonth(shiftMonth(month, -1))} disabled={!canPrev} aria-label="Previous month">
          ‹
        </button>
        <span className="bk-cal-title">{MONTH_FMT.format(new Date(`${month}T00:00:00Z`))}</span>
        <button type="button" className="bk-cal-nav" onClick={() => setMonth(shiftMonth(month, 1))} disabled={!canNext} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="bk-cal-grid" role="grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className="bk-cal-wd" aria-hidden="true">
            {w}
          </span>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} className="bk-cal-empty" />;
          const tooEarly = iso < earliest || iso > latest;
          const taken = unavailable.has(iso);
          const isStart = iso === startDate;
          const isEnd = iso === end;
          const inRange = Boolean(startDate && end && iso > startDate && iso < end);
          const conflict = conflictDays.has(iso);
          const classes = ["bk-day"];
          if (tooEarly) classes.push("is-disabled");
          if (taken) classes.push("is-taken");
          if (isStart) classes.push("is-start");
          if (isEnd) classes.push("is-end");
          if (inRange) classes.push("is-range");
          if (conflict) classes.push("is-conflict");
          const label = `${DAY_LABEL.format(new Date(`${iso}T00:00:00Z`))}${taken ? ", booked" : tooEarly ? ", not available online" : ""}${
            isStart ? ", delivery day" : isEnd ? ", pickup day" : ""
          }`;
          return (
            <button
              key={iso}
              type="button"
              className={classes.join(" ")}
              disabled={tooEarly || taken}
              onClick={() => onSelect(iso)}
              aria-label={label}
              aria-pressed={isStart}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="bk-cal-legend">
        <span>
          <i className="lg lg-start" /> Delivery
        </span>
        <span>
          <i className="lg lg-range" /> Your stay
        </span>
        <span>
          <i className="lg lg-taken" /> Booked
        </span>
        {loadingMonths && <span className="bk-cal-loading">Checking dates…</span>}
      </div>
    </div>
  );
}
