/** Date-only UTC arithmetic: inclusive durations and exclusive offsets are distinct. */
export interface WorkCalendar {
    closedDates: string[];
    coverage: {
        start: string;
        end: string;
        verified: boolean;
    }[];
}
export const dayNumber = (iso: string) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(iso))
    throw new Error(`Invalid schedule date: ${iso}`); const n = Date.parse(`${iso}T00:00:00Z`); if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== iso)
    throw new Error(`Invalid schedule date: ${iso}`); return n / 86400000; };
export const isoDay = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
export const working = (date: string, calendar: WorkCalendar) => { const day = new Date(dayNumber(date) * 86400000).getUTCDay(); return day !== 0 && day !== 6 && !calendar.closedDates.includes(date); };
export function normalizeWorkday(date: string, calendar: WorkCalendar, direction = 1) { let n = dayNumber(date); for (let guard = 0; guard < 3660; guard++, n += direction) {
    const iso = isoDay(n);
    if (working(iso, calendar))
        return iso;
} throw new Error('Calendar has no available workdays within ten years. Review closures.'); }
/** n increments excludes the anchor; zero normalizes the anchor. */
export function offsetWorkdays(date: string, n: number, calendar: WorkCalendar) { if (!Number.isInteger(n))
    throw new Error('Workday offset must be an integer.'); if (!n)
    return normalizeWorkday(date, calendar); let day = dayNumber(date), remaining = Math.abs(n), guard = 0; while (remaining) {
    day += Math.sign(n);
    if (++guard > 36600)
        throw new Error('Schedule exceeds supported calendar range.');
    if (working(isoDay(day), calendar))
        remaining--;
} return isoDay(day); }
export const inclusiveDue = (start: string, duration: number, calendar: WorkCalendar) => { if (!Number.isInteger(duration) || duration < 1)
    throw new Error('Duration must be at least one FSCJ workday.'); return offsetWorkdays(normalizeWorkday(start, calendar), duration - 1, calendar); };
export function calendarCovered(start: string, end: string, calendar: WorkCalendar) { for (let n = dayNumber(start); n <= dayNumber(end); n++)
    if (!calendar.coverage.some(c => c.verified && c.start <= isoDay(n) && c.end >= isoDay(n)))
        return false; return true; }
