import { addDays, format, parseISO } from "date-fns";
import { DRILL_INTERVAL_DAYS, isUsable } from "./engine";
import type { State } from "./types";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 line folding: continuation lines start with one space, none longer than 75 characters. */
const fold = (line: string) => {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
};

const dateOnly = (d: Date) => format(d, "yyyyMMdd");

/** Calendar reminders: every upcoming expiry (alarm one week before) and the next drill. */
export function buildIcs(state: State, now: Date): string {
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  const stamp = `${format(utc, "yyyyMMdd")}T${format(utc, "HHmmss")}Z`;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ready72//Preparedness reminders//EN", "CALSCALE:GREGORIAN"];

  const event = (uid: string, day: Date, summary: string, description: string) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}@ready72`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateOnly(day)}`,
      `DTEND;VALUE=DATE:${dateOnly(addDays(day, 1))}`,
      `SUMMARY:${esc(summary)}`,
      `DESCRIPTION:${esc(description)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(summary)}`,
      "TRIGGER:-P7D",
      "END:VALARM",
      "END:VEVENT",
    );
  };

  for (const e of state.entries) {
    if (!e.expiry || !isUsable(e, now)) continue;
    event(`expiry-${e.id}`, parseISO(e.expiry), `Ready72: ${e.name} expires`, "Replace it so your kit still counts.");
  }
  const last = state.drills[0];
  const nextDrill = last ? addDays(parseISO(last), DRILL_INTERVAL_DAYS) : addDays(now, 14);
  event("drill", nextDrill < now ? addDays(now, 7) : nextDrill, "Ready72: practise your emergency drill", "Walk through your plan and log the drill in Ready72.");

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
