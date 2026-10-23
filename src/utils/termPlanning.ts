import type { CourseDevelopment, TermRelease } from '../types';
const parseDate = (date:string) => { const [y,m,d]=date.split('-').map(Number); return new Date(y,m-1,d,12); };
const formatDate = (date:Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
import { offsetWorkdays, calendarCovered, type WorkCalendar } from './fscjCalendar';

export const TARGET_TERMS = ['Spring Term', 'Summer Term', 'Fall Term'] as const;
export type TargetTerm = typeof TARGET_TERMS[number];
export type VerificationStatus = 'verified' | 'manual' | 'unconfirmed';
export interface TermCalendarRecord {
  id: string;
  academicYear: string;
  term: TargetTerm;
  year: number;
  sessionAStartDate?: string;
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  lastVerifiedDate?: string;
  operatingCalendarId?: string;
  recommendedProjectStartWindow?: { start: string; end: string } | null;
}
export interface OperatingCalendarRecord {
  id: string;
  academicYear: string;
  coverageStart: string;
  coverageEnd: string;
  closedDates: string[];
  sourceUrl: string;
  verificationStatus: VerificationStatus;
  lastVerifiedDate?: string;
}
export interface TermPlanningSettings {
  planningWindowWorkdays?: number;
  multimediaWorkdays?: number;
  proposals?: ProposedCourse[];
  terms: TermCalendarRecord[];
  operatingCalendars: OperatingCalendarRecord[];
}
export interface ProposedCourse { id: string; courseNumber: string; termRelease: TargetTerm; targetTermYear: number; onboarding: boolean; projectStartDate?: string; convertedProjectId?: string; }
export function fscjCalendar(settings?: TermPlanningSettings, customBlocked: string[] = []): WorkCalendar {
 const calendars = getTermPlanningSettings(settings).operatingCalendars;
 return { closedDates: [...new Set([...calendars.flatMap(c=>c.closedDates), ...customBlocked])], coverage: calendars.map(c=>({start:c.coverageStart,end:c.coverageEnd,verified:c.verificationStatus==='verified'})) };
}
export const TERM_SOURCE = 'https://catalog.fscj.edu/academics/academic-calendar';
export const OPERATING_SOURCE = 'https://www.fscj.edu/docs/default-source/hr/2026-2027-operating-calendar.pdf?sfvrsn=51df2221_3';
export const FLEX_SCHEDULE_SOURCE = 'https://www.fscj.edu/docs/default-source/hr/manager-resources/supervisor-segment/april-2024.pdf?sfvrsn=b24a8565_3';
export const VERIFIED_ON = '2026-10-23';
export const validISODate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && formatDate(parseDate(value)) === value;
export const termId = (term: TargetTerm, year: number) => `${term.split(' ')[0].toLowerCase()}-${year}`;
export const termAcademicYear = (term: TargetTerm, year: number) => term === 'Fall Term' ? `${year}-${year + 1}` : `${year - 1}-${year}`;
const datesBetween = (first: string, last: string, weekday?: number) => {
  const dates: string[] = [];
  const date = parseDate(first);
  while (formatDate(date) <= last) {
    if (weekday === undefined || date.getDay() === weekday) dates.push(formatDate(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
};
// Published 2026–27 closures and the operating calendar's flexible-workweek
// periods. Friday treatment follows FSCJ HR's published 36-hour-week policy.
const closures = [...new Set([
  '2026-07-06', '2026-09-07', '2026-11-11',
  ...datesBetween('2026-11-25', '2026-11-29'),
  ...datesBetween('2026-12-19', '2027-01-03'),
  '2027-01-18', '2027-02-15', ...datesBetween('2027-03-15', '2027-03-21'), '2027-05-31',
  ...datesBetween('2026-07-01', '2026-08-15', 5),
  ...datesBetween('2027-05-02', '2027-06-30', 5),
])].sort();
export const OFFICIAL_TERM_PLANNING: TermPlanningSettings = {
  terms: ([['Fall Term', 2026, '2026-08-31'], ['Spring Term', 2027, '2027-01-11'], ['Summer Term', 2027, '2027-05-10']] as const).map(([term, year, date]) => ({
    id: termId(term, year), academicYear: termAcademicYear(term, year), term, year,
    sessionAStartDate: date, sourceUrl: TERM_SOURCE, verificationStatus: 'verified', lastVerifiedDate: VERIFIED_ON,
    operatingCalendarId: 'fscj-2026-2027', recommendedProjectStartWindow: null,
  })),
  operatingCalendars: [{ id: 'fscj-2026-2027', academicYear: '2026-2027', coverageStart: '2026-07-01', coverageEnd: '2027-06-30',
    closedDates: closures, sourceUrl: OPERATING_SOURCE, verificationStatus: 'verified', lastVerifiedDate: VERIFIED_ON }],
};
export function getTermPlanningSettings(saved?: TermPlanningSettings): TermPlanningSettings {
  const merge = <T extends { id: string }>(base: T[], extra?: T[]) => [...new Map([...base, ...(Array.isArray(extra) ? extra : [])].map((record) => [record.id, record])).values()];
  const terms = new Map(OFFICIAL_TERM_PLANNING.terms.map((term) => [term.id, term]));
  for (const term of Array.isArray(saved?.terms) ? saved.terms : []) {
    const confirmed = terms.get(term.id);
    if (confirmed?.verificationStatus === 'verified' && confirmed.sessionAStartDate && !validISODate(term.sessionAStartDate)) continue;
    terms.set(term.id, term);
  }
  return { ...saved, terms: [...terms.values()], operatingCalendars: merge(OFFICIAL_TERM_PLANNING.operatingCalendars, saved?.operatingCalendars) };
}
export function normalizeTermRelease(value?: string): TargetTerm | undefined {
  const match = /^(Spring|Summer|Fall)(?:\s+(?:Term|[ABC]))?(?:\s+\d{4})?$/i.exec((value || '').trim());
  return match ? `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()} Term` as TargetTerm : undefined;
}
export function courseTargetYear(course: Partial<CourseDevelopment>): number | undefined {
  if (Number.isInteger(course.targetTermYear) && course.targetTermYear! >= 1900 && course.targetTermYear! <= 9999) return course.targetTermYear;
  const embedded = /\b(\d{4})\b/.exec(course.termRelease || '');
  if (embedded) return Number(embedded[1]);
  const academicYear = /^(\d{4})(?:[–-](\d{2}|\d{4}))?$/.exec(String(course.academicYear || ''));
  if (academicYear) {
    const start = Number(academicYear[1]);
    let end = academicYear[2] ? Number(academicYear[2]) : start;
    if (academicYear[2]?.length === 2) { end += Math.floor(start / 100) * 100; if (end < start) end += 100; }
    return normalizeTermRelease(course.termRelease) === 'Fall Term' ? start : end;
  }
  return validISODate(course.termDeadline?.slice(0, 10)) ? Number(course.termDeadline!.slice(0, 4)) : undefined;
}
export function courseTargetLabel(course: Partial<CourseDevelopment>): string {
  const term = normalizeTermRelease(course.termRelease);
  const year = courseTargetYear(course);
  return `${term || course.termRelease || 'Target term requires confirmation'}${year ? ` ${year}` : ' — year requires confirmation'}`;
}
export function targetTermFields(termRelease: TermRelease, year: string | number, previous?: CourseDevelopment): Partial<CourseDevelopment> & Pick<CourseDevelopment, 'termRelease'> {
  const term = normalizeTermRelease(termRelease);
  return {
    termRelease: term || termRelease,
    ...(year !== '' && Number.isInteger(Number(year)) ? { targetTermYear: Number(year) } : {}),
    ...(previous && term && previous.termRelease !== term && !previous.originalTermRelease ? { originalTermRelease: previous.termRelease } : {}),
  };
}
export function getCourseTerm(course: Partial<CourseDevelopment>, settings?: TermPlanningSettings): TermCalendarRecord | undefined {
  const term = normalizeTermRelease(course.termRelease), year = courseTargetYear(course);
  return term && year ? getTermPlanningSettings(settings).terms.find((record) => record.term === term && record.year === year) : undefined;
}
export function planningDeadline(term: TermCalendarRecord | undefined, settings?: TermPlanningSettings, customBlocked: string[] = []) {
  if (!term || !validISODate(term.sessionAStartDate)) return { date: '', confirmed: false, message: 'Session A start date requires confirmation.' };
  const calendar = fscjCalendar(settings,customBlocked);
  const date = offsetWorkdays(term.sessionAStartDate, -30, calendar);
  const confirmed = calendarCovered(date, term.sessionAStartDate, calendar) && term.verificationStatus === 'verified';
  return { date, confirmed, message: confirmed ? 'Confirmed' : 'Provisional — term date or operating calendar requires verification.' };
}
export function upcomingTerms(today: string, settings?: TermPlanningSettings): TermCalendarRecord[] {
  const config = getTermPlanningSettings(settings), year = Number(today.slice(0, 4)), month = Number(today.slice(5, 7));
  const candidates: TermCalendarRecord[] = [];
  for (let nextYear = year; nextYear <= year + 2; nextYear++) for (const [index, term] of TARGET_TERMS.entries()) {
    const known = config.terms.find((record) => record.term === term && record.year === nextYear);
    // Undated future terms are ordered as term slots; no start date is inferred.
    if (known?.sessionAStartDate ? known.sessionAStartDate < today : nextYear === year && month > [4, 8, 12][index]) continue;
    candidates.push(known || { id: termId(term, nextYear), academicYear: termAcademicYear(term, nextYear), term, year: nextYear,
      sourceUrl: TERM_SOURCE, verificationStatus: 'unconfirmed', recommendedProjectStartWindow: null });
  }
  return candidates.sort((a, b) => a.sessionAStartDate && b.sessionAStartDate ? a.sessionAStartDate.localeCompare(b.sessionAStartDate)
    : a.year - b.year || TARGET_TERMS.indexOf(a.term) - TARGET_TERMS.indexOf(b.term)).slice(0, 3);
}
export const planningDateLabel = (date?: string) => validISODate(date) ? parseDate(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Requires confirmation';
const officialUrl = (value: unknown) => { try { const url = new URL(String(value)); return url.protocol === 'https:' && (url.hostname === 'fscj.edu' || url.hostname.endsWith('.fscj.edu')); } catch { return false; } };
export function validateTermPlanningSettings(value: unknown): string {
  const config = value as TermPlanningSettings;
  if (!config || !Array.isArray(config.terms) || !Array.isArray(config.operatingCalendars)) return 'Term dates and operating calendars are required.';
  if (config.planningWindowWorkdays !== undefined && (!Number.isInteger(config.planningWindowWorkdays) || config.planningWindowWorkdays < 1 || config.planningWindowWorkdays > 260)) return 'Planning window must be 1–260 workdays.';
  if (config.multimediaWorkdays !== undefined && (!Number.isInteger(config.multimediaWorkdays) || config.multimediaWorkdays < 1 || config.multimediaWorkdays > 260)) return 'Multimedia estimate must be 1–260 workdays.';
  if (config.proposals !== undefined && (!Array.isArray(config.proposals) || config.proposals.some(p => !p.id || !/^[A-Z]{3}\d{4}$/.test(p.courseNumber) || !TARGET_TERMS.includes(p.termRelease) || !Number.isInteger(p.targetTermYear) || p.targetTermYear < 1900 || p.targetTermYear > 9999 || typeof p.onboarding !== 'boolean' || (p.projectStartDate && !validISODate(p.projectStartDate))) || new Set(config.proposals.map(p=>p.id)).size !== config.proposals.length)) return 'Invalid or duplicate proposed course.';
  for (const term of config.terms) {
    if (!term || typeof term !== 'object') return 'Invalid term record.';
    if (!TARGET_TERMS.includes(term.term) || !Number.isInteger(term.year) || term.year < 1900 || term.year > 9999 || term.id !== termId(term.term, term.year)
      || !term.academicYear || !officialUrl(term.sourceUrl) || !['verified', 'manual', 'unconfirmed'].includes(term.verificationStatus)
      || (term.sessionAStartDate && (!validISODate(term.sessionAStartDate) || Number(term.sessionAStartDate.slice(0,4)) !== term.year))
      || (term.verificationStatus === 'verified' && (!validISODate(term.sessionAStartDate) || !validISODate(term.lastVerifiedDate)))) return 'Provide a valid term, year, Session A date, official FSCJ source, and verification information.';
  }
  for (const calendar of config.operatingCalendars) {
    if (!calendar || typeof calendar !== 'object') return 'Invalid operating calendar record.';
    if (!calendar.id || !calendar.academicYear || !validISODate(calendar.coverageStart) || !validISODate(calendar.coverageEnd)
      || calendar.coverageStart > calendar.coverageEnd || !Array.isArray(calendar.closedDates) || calendar.closedDates.some((date) => !validISODate(date))
      || !officialUrl(calendar.sourceUrl) || !['verified', 'manual', 'unconfirmed'].includes(calendar.verificationStatus)
      || (calendar.verificationStatus === 'verified' && !validISODate(calendar.lastVerifiedDate))) return 'Provide valid operating calendar coverage, closure dates, FSCJ source, and verification information.';
  }
  if (new Set(config.terms.map((term) => term.id)).size !== config.terms.length || new Set(config.operatingCalendars.map((calendar) => calendar.id)).size !== config.operatingCalendars.length) return 'Duplicate term or operating calendar identifiers are not allowed.';
  return '';
}

export function validateCourseTargetTerm(course: Partial<CourseDevelopment>): string {
  if (course.targetTermYear !== undefined && (!Number.isInteger(course.targetTermYear) || course.targetTermYear < 1900 || course.targetTermYear > 9999)) return 'Enter a valid Target Term Year.';
  return '';
}
