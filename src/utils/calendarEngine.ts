import { CourseDevelopmentTask } from "../types";

export const TIMEZONE = "America/New_York";

/**
 * FSCJ-specific manual closures that cannot be reliably calculated.
 * Add future Spring Break / Winter Break dates here as needed.
 */
export const FSCJ_MANUAL_CLOSURES: Record<string, string[]> = {
  "2026": [
    "2026-03-09",
    "2026-03-10",
    "2026-03-11",
    "2026-03-12",
    "2026-03-13",
    "2026-12-24",
    "2026-12-28",
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
  ],
};

/**
 * Date-only helper.
 * This avoids the common JavaScript bug where YYYY-MM-DD shifts backward
 * because it gets interpreted as UTC.
 */
export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(Number.NaN);

  const clean = dateStr.trim().slice(0, 10);
  const parts = clean.split("-").map(Number);

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return new Date(Number.NaN);
  }

  const [year, month, day] = parts;

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Formats a Date as YYYY-MM-DD using local date parts.
 * Do not use toISOString() for manually entered date-only values.
 */
export function formatDate(dateObj: Date): string {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return "";

  const yr = dateObj.getFullYear();
  const mo = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dy = String(dateObj.getDate()).padStart(2, "0");

  return `${yr}-${mo}-${dy}`;
}

/**
 * Use this for values from <input type="date">.
 * It returns exactly the date string entered/selected.
 */
export function normalizeDateOnly(dateStr: string): string {
  if (!dateStr) return "";

  const parsed = parseDate(dateStr);

  if (Number.isNaN(parsed.getTime())) return "";

  return formatDate(parsed);
}

function getNthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekday: number,
  nth: number
): string {
  const date = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  let count = 0;

  while (date.getMonth() === monthIndex) {
    if (date.getDay() === weekday) {
      count++;

      if (count === nth) {
        return formatDate(date);
      }
    }

    date.setDate(date.getDate() + 1);
  }

  throw new Error("Unable to calculate nth weekday.");
}

function getLastWeekdayOfMonth(year: number, monthIndex: number, weekday: number): string {
  const date = new Date(year, monthIndex + 1, 0, 12, 0, 0, 0);

  while (date.getMonth() === monthIndex) {
    if (date.getDay() === weekday) {
      return formatDate(date);
    }

    date.setDate(date.getDate() - 1);
  }

  throw new Error("Unable to calculate last weekday.");
}

function getObservedFixedHoliday(year: number, monthIndex: number, day: number): string {
  const actual = new Date(year, monthIndex, day, 12, 0, 0, 0);

  if (actual.getDay() === 6) {
    actual.setDate(actual.getDate() - 1);
  }

  if (actual.getDay() === 0) {
    actual.setDate(actual.getDate() + 1);
  }

  return formatDate(actual);
}

export function stepCalendarDays(startDateStr: string, days: number): string {
  const date = parseDate(startDateStr);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date supplied to stepCalendarDays: ${startDateStr}`);
  }

  date.setDate(date.getDate() + days);

  return formatDate(date);
}

export function getFederalHolidaysForYear(year: number): string[] {
  const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4);

  return [
    getObservedFixedHoliday(year, 0, 1),
    getNthWeekdayOfMonth(year, 0, 1, 3),
    getNthWeekdayOfMonth(year, 1, 1, 3),
    getLastWeekdayOfMonth(year, 4, 1),
    getObservedFixedHoliday(year, 5, 19),
    getObservedFixedHoliday(year, 6, 4),
    getNthWeekdayOfMonth(year, 8, 1, 1),
    getObservedFixedHoliday(year, 10, 11),
    thanksgiving,
    stepCalendarDays(thanksgiving, 1),
    getObservedFixedHoliday(year, 11, 25),
  ];
}

export function getCollegeClosuresForYear(year: number): string[] {
  return Array.from(
    new Set([
      ...getFederalHolidaysForYear(year),
      ...(FSCJ_MANUAL_CLOSURES[String(year)] || []),
    ])
  ).sort();
}

export const FSCJ_HOLIDAYS = Array.from(
  new Set([
    ...getCollegeClosuresForYear(2026),
    ...getCollegeClosuresForYear(2027),
    ...getCollegeClosuresForYear(2028),
    ...getCollegeClosuresForYear(2029),
    ...getCollegeClosuresForYear(2030),
  ])
).sort();

export const TASK_TEMPLATES = [
  { id: 1, phase: "Milestone", name: "Start compensation", assignedTo: "Operations" as const, durationDays: 1, isOb: true },
  { id: 2, phase: "Project Management", name: "Send SME introduction email [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1, isOb: true },
  { id: 3, phase: "Discovery & Planning", name: "Schedule onboarding meeting [Calendar]", assignedTo: "Instructional Designer" as const, durationDays: 1, isOb: true },
  { id: 4, phase: "Discovery & Planning", name: "Customize onboarding presentation", assignedTo: "Instructional Designer" as const, durationDays: 1, isOb: true },
  { id: 5, phase: "Discovery & Planning", name: "Send onboarding reminder [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1, isOb: true },
  { id: 6, phase: "Milestone", name: "Conduct onboarding meeting, then Send recap [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1, isOb: true },
  { id: 7, phase: "Project Management", name: "Finalize timeline", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 8, phase: "Project Management", name: "Request initial meeting [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 9, phase: "Project Management", name: "Create course development tasks [Quickbase]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 10, phase: "Project Management", name: "Obtain course outline", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 11, phase: "Milestone", name: "Conduct initial meeting, then Send recap [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 12, phase: "Course Design", name: "Draft Course Design Plan", assignedTo: "Subject Matter Expert" as const, durationDays: 1 },
  { id: 13, phase: "Course Design", name: "Finalize Course Design Plan", assignedTo: "Instructional Designer" as const, durationDays: 5 },
  { id: 14, phase: "Project Management", name: "Schedule kickoff meeting [Calendar]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 15, phase: "Course Design", name: "Complete Course Design Plan", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 16, phase: "Project Management", name: "Analyze instructional material accessibility", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 17, phase: "Stakeholder Engagement", name: "Send kickoff reminder and agenda [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 18, phase: "Milestone", name: "Conduct kickoff meeting, then Send recap [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 19, phase: "Project Management", name: "Schedule midpoint review [Calendar]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 20, phase: "Project Management", name: "Enter instructional materials [Quickbase]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 21, phase: "Course Development", name: "Create module templates", assignedTo: "Instructional Designer" as const, durationDays: 4 },
  { id: 22, phase: "Project Management", name: "Coordinate module delivery schedule [Email]", assignedTo: "Instructional Designer" as const, durationDays: 4 },
  { id: 23, phase: "Project Management", name: "Configure calendar reminders [Calendar]", assignedTo: "Instructional Designer" as const, durationDays: 4 },
  { id: 24, phase: "Project Management", name: "Request Canvas shell [Quickbase]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 25, phase: "Course Development", name: "Develop Module 1 content", assignedTo: "Subject Matter Expert" as const, durationDays: 5 },
  { id: 26, phase: "Course Development", name: "Review & Build Module 1 content", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 27, phase: "Course Development", name: "Develop Module 1 multimedia", assignedTo: "Multimedia" as const, durationDays: 10 },
  { id: 28, phase: "Course Development", name: "Develop Module 2 content", assignedTo: "Subject Matter Expert" as const, durationDays: 5 },
  { id: 29, phase: "Course Development", name: "Review & Build Module 2 content", assignedTo: "Multimedia" as const, durationDays: 1 },
  { id: 30, phase: "Course Development", name: "Develop Module 2 multimedia", assignedTo: "Instructional Designer" as const, durationDays: 10 },
  { id: 31, phase: "Course Development", name: "Develop Module 3 content", assignedTo: "Subject Matter Expert" as const, durationDays: 5 },
  { id: 32, phase: "Course Development", name: "Review & Build Module 3 content", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 33, phase: "Course Development", name: "Develop Module 3 multimedia", assignedTo: "Multimedia" as const, durationDays: 10 },
  { id: 34, phase: "Course Development", name: "Develop Module 4 content", assignedTo: "Subject Matter Expert" as const, durationDays: 5 },
  { id: 35, phase: "Course Development", name: "Review & Build Module 4 content", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 36, phase: "Course Development", name: "Develop Module 4 multimedia", assignedTo: "Multimedia" as const, durationDays: 10 },
  { id: 37, phase: "Course Development", name: "Develop Module 5 content", assignedTo: "Subject Matter Expert" as const, durationDays: 5 },
  { id: 38, phase: "Course Development", name: "Review & Build Module 5 content", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 39, phase: "Course Development", name: "Develop Module 5 multimedia", assignedTo: "Multimedia" as const, durationDays: 10 },
  { id: 40, phase: "Course Development", name: "Develop Module 6 content", assignedTo: "Subject Matter Expert" as const, durationDays: 5 },
  { id: 41, phase: "Course Development", name: "Review & Build Module 6 content", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 42, phase: "Course Development", name: "Develop Module 6 multimedia", assignedTo: "Multimedia" as const, durationDays: 10 },
  { id: 43, phase: "Course Development", name: "Develop Module 7 content", assignedTo: "Subject Matter Expert" as const, durationDays: 5 },
  { id: 44, phase: "Course Development", name: "Review & Build Module 7 content", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 45, phase: "Course Development", name: "Develop Module 7 multimedia", assignedTo: "Multimedia" as const, durationDays: 10 },
  { id: 46, phase: "Course Development", name: "Finalize course documents", assignedTo: "Subject Matter Expert" as const, durationDays: 3 },
  { id: 47, phase: "Project Management", name: "Send midpoint reminder and agenda [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 48, phase: "Milestone", name: "Conduct midpoint review, and then Send recap [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 49, phase: "Project Management", name: "Schedule final review [Calendar]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 50, phase: "Quality Assurance", name: "Submit proofreading request [Quickbase]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 51, phase: "Quality Assurance", name: "Complete proofreading [Quality Assurance]", assignedTo: "Quality Assurance" as const, durationDays: 5 },
  { id: 52, phase: "Quality Assurance", name: "Complete pre-QA checklist", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 53, phase: "Quality Assurance", name: "Assign QA reviewer", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 54, phase: "Quality Assurance", name: "Request QA review [Quickbase]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 55, phase: "Quality Assurance", name: "Complete QA review", assignedTo: "Quality Assurance" as const, durationDays: 5 },
  { id: 56, phase: "Quality Assurance", name: "Address QA findings", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 57, phase: "Project Management", name: "Send final review reminder and agenda", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 58, phase: "Milestone", name: "Conduct final review, then Send recap [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 59, phase: "Project Closeout", name: "Send stipend notification [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 60, phase: "Project Closeout", name: "Request stipend completion [Quickbase]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 61, phase: "Project Closeout", name: "Request code check and archive [Quickbase]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 62, phase: "Project Closeout", name: "Complete code check and archive", assignedTo: "Multimedia" as const, durationDays: 5 },
  { id: 63, phase: "Project Closeout", name: "Request course completion [Quickbase]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
  { id: 64, phase: "Milestone", name: "Send project completion notification [Email]", assignedTo: "Instructional Designer" as const, durationDays: 1 },
];

export function getSummerBounds(year: number) {
  return {
    start: `${year}-05-04`,
    end: `${year}-08-08`,
  };
}

export function isSummerDate(dateStr: string): boolean {
  const dateObj = parseDate(dateStr);

  if (Number.isNaN(dateObj.getTime())) return false;

  const { start, end } = getSummerBounds(dateObj.getFullYear());

  return dateStr >= start && dateStr <= end;
}

export function isCollegeClosure(dateStr: string, customBlocked: string[] = []): boolean {
  const d = parseDate(dateStr);

  if (Number.isNaN(d.getTime())) return false;

  return (
    getCollegeClosuresForYear(d.getFullYear()).includes(dateStr) ||
    customBlocked.includes(dateStr)
  );
}

export function isWorkingDay(dateStr: string, customBlocked: string[] = []): boolean {
  const d = parseDate(dateStr);

  if (Number.isNaN(d.getTime())) return false;

  const day = d.getDay();

  if (day === 0 || day === 6) return false;
  if (day === 5 && isSummerDate(dateStr)) return false;
  if (isCollegeClosure(dateStr, customBlocked)) return false;

  return true;
}

export function stepWorkingDays(
  startDateStr: string,
  days: number,
  direction: number,
  customBlocked: string[] = []
): string {
  let dateObj = parseDate(startDateStr);

  if (Number.isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date supplied to stepWorkingDays: ${startDateStr}`);
  }

  const safeDirection = direction >= 0 ? 1 : -1;
  let steps = 0;
  let guard = 0;

  while (!isWorkingDay(formatDate(dateObj), customBlocked)) {
    dateObj.setDate(dateObj.getDate() + safeDirection);
    guard++;

    if (guard > 370) {
      throw new Error("Unable to find working day within safe limit.");
    }
  }

  while (steps < Math.abs(days)) {
    dateObj.setDate(dateObj.getDate() + safeDirection);

    if (isWorkingDay(formatDate(dateObj), customBlocked)) {
      steps++;
    }

    guard++;

    if (guard > 1000) {
      throw new Error("Business-day calculation exceeded safe limit.");
    }
  }

  return formatDate(dateObj);
}

export function countWorkingDaysBetween(
  startDateStr: string,
  endDateStr: string,
  customBlocked: string[] = []
): number {
  if (!startDateStr || !endDateStr || startDateStr > endDateStr) return 0;

  let current = parseDate(startDateStr);
  const end = parseDate(endDateStr);

  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) return 0;

  let count = 0;
  let guard = 0;

  while (current <= end) {
    if (isWorkingDay(formatDate(current), customBlocked)) {
      count++;
    }

    current.setDate(current.getDate() + 1);
    guard++;

    if (guard > 1000) {
      throw new Error("Working-day range calculation exceeded safe limit.");
    }
  }

  return count;
}

export function countWorkingHoursInDay(dateStr: string, customBlocked: string[] = []): number {
  if (!isWorkingDay(dateStr, customBlocked)) return 0;

  return parseDate(dateStr).getDay() === 5 ? 4 : 10;
}

export function calculateDeadlineFromTermStart(
  termStartDate: string,
  customBlocked: string[] = []
): string {
  return stepWorkingDays(termStartDate, 30, -1, customBlocked);
}

function makeTask(tmp: any, onboarding: boolean): CourseDevelopmentTask {
  if (tmp.isOb && !onboarding) {
    return {
      id: tmp.id,
      phase: tmp.phase,
      name: tmp.name,
      assignedTo: tmp.assignedTo,
      roleOwner: tmp.assignedTo,
      status: "Not Applicable",
      startDate: "",
      dueDate: "",
      durationDays: 0,
      effectiveDuration: 0,
      isGenerated: true,
    };
  }

  return {
    id: tmp.id,
    phase: tmp.phase,
    name: tmp.name,
    assignedTo: tmp.assignedTo,
    roleOwner: tmp.assignedTo,
    status: "Not Started",
    startDate: tmp.s,
    dueDate: tmp.e,
    autoStartDate: tmp.s,
    autoDueDate: tmp.e,
    effectiveStartDate: tmp.s,
    effectiveDueDate: tmp.e,
    durationDays: tmp.durationDays,
    autoDuration: tmp.durationDays,
    effectiveDuration: tmp.durationDays,
    isGenerated: true,
  };
}

export function calculateTimelineTasks(
  termDeadline: string,
  onboarding: boolean,
  customBlocked: string[] = []
): CourseDevelopmentTask[] {
  const anchor = stepWorkingDays(termDeadline, 0, -1, customBlocked);

  const date_64 = anchor;
  const date_63 = anchor;

  const end_62 = stepWorkingDays(anchor, 1, -1, customBlocked);
  const start_62 = stepWorkingDays(end_62, 4, -1, customBlocked);

  const date_58 = stepWorkingDays(start_62, 1, -1, customBlocked);
  const date_59 = date_58;
  const date_60 = date_58;
  const date_61 = date_58;

  const start_57 = stepWorkingDays(date_58, 2, -1, customBlocked);
  const end_57 = start_57;
  const date_56 = date_58;

  const end_55 = stepWorkingDays(date_58, 2, -1, customBlocked);
  const start_55 = stepWorkingDays(end_55, 4, -1, customBlocked);

  const date_52 = stepWorkingDays(start_55, 1, -1, customBlocked);
  const end_51 = stepWorkingDays(date_52, 1, -1, customBlocked);
  const start_51 = stepWorkingDays(end_51, 4, -1, customBlocked);

  const start_53 = start_51;
  const end_53 = end_51;
  const start_54 = start_51;
  const end_54 = end_51;

  const date_50 = stepWorkingDays(start_51, 1, -1, customBlocked);
  const end_46 = stepWorkingDays(date_50, 1, -1, customBlocked);
  const start_46 = stepWorkingDays(end_46, 2, -1, customBlocked);

  const end_Review_7 = stepWorkingDays(start_46, 1, -1, customBlocked);

  const review_ends: string[] = [];
  const review_starts: string[] = [];
  const develop_ends: string[] = [];
  const develop_starts: string[] = [];
  const multimedia_ends: string[] = [];
  const multimedia_starts: string[] = [];

  let current_review_end = end_Review_7;

  for (let m = 7; m >= 1; m--) {
    const end_rev = current_review_end;
    const start_rev = end_rev;

    const end_dev = stepWorkingDays(start_rev, 1, -1, customBlocked);
    const start_dev = stepWorkingDays(end_dev, 4, -1, customBlocked);

    const start_multi = stepWorkingDays(end_rev, 1, 1, customBlocked);
    const end_multi = stepWorkingDays(start_multi, 9, 1, customBlocked);

    review_ends[m] = end_rev;
    review_starts[m] = start_rev;
    develop_ends[m] = end_dev;
    develop_starts[m] = start_dev;
    multimedia_ends[m] = end_multi;
    multimedia_starts[m] = start_multi;

    current_review_end = stepWorkingDays(start_dev, 1, -1, customBlocked);
  }

  const date_48 = stepWorkingDays(review_ends[3], 5, 1, customBlocked);
  const start_47 = stepWorkingDays(date_48, 2, -1, customBlocked);
  const end_47 = start_47;
  const date_49 = stepWorkingDays(date_48, 1, 1, customBlocked);

  const end_21 = stepWorkingDays(develop_starts[1], 1, -1, customBlocked);
  const start_21 = stepWorkingDays(end_21, 3, -1, customBlocked);

  const start_22 = start_21;
  const end_22 = end_21;
  const start_23 = start_21;
  const end_23 = end_21;
  const start_24 = start_21;
  const end_24 = end_21;

  const date_15 = stepWorkingDays(start_21, 1, -1, customBlocked);
  const date_16 = stepWorkingDays(date_15, 1, 1, customBlocked);

  const end_13 = stepWorkingDays(date_15, 1, -1, customBlocked);
  const start_13 = stepWorkingDays(end_13, 4, -1, customBlocked);

  const date_12 = stepWorkingDays(start_13, 1, -1, customBlocked);
  const date_14 = date_12;

  const date_18 = stepWorkingDays(date_14, 5, 1, customBlocked);
  const date_17 = stepWorkingDays(date_18, 2, -1, customBlocked);

  const date_19 = stepWorkingDays(date_18, 1, 1, customBlocked);
  const date_20 = date_19;

  const date_10 = stepWorkingDays(date_12, 1, -1, customBlocked);
  const date_11 = stepWorkingDays(date_10, 2, 1, customBlocked);

  const date_8 = stepWorkingDays(date_11, 5, -1, customBlocked);
  const date_9 = date_8;

  const date_2 = stepWorkingDays(date_8, 10, -1, customBlocked);
  const date_7 = stepWorkingDays(date_2, 3, 1, customBlocked);
  const date_1 = stepWorkingDays(date_2, 3, -1, customBlocked);

  const date_3 = date_2;
  const date_4 = date_2;
  const date_6 = stepWorkingDays(date_3, 5, 1, customBlocked);
  const date_5 = stepWorkingDays(date_6, 2, -1, customBlocked);

  const rawTemplates = [
    { ...TASK_TEMPLATES[0], s: date_1, e: date_1 },
    { ...TASK_TEMPLATES[1], s: date_2, e: date_2 },
    { ...TASK_TEMPLATES[2], s: date_3, e: date_3 },
    { ...TASK_TEMPLATES[3], s: date_4, e: date_4 },
    { ...TASK_TEMPLATES[4], s: date_5, e: date_5 },
    { ...TASK_TEMPLATES[5], s: date_6, e: date_6 },
    { ...TASK_TEMPLATES[6], s: date_7, e: date_7 },
    { ...TASK_TEMPLATES[7], s: date_8, e: date_8 },
    { ...TASK_TEMPLATES[8], s: date_9, e: date_9 },
    { ...TASK_TEMPLATES[9], s: date_10, e: date_10 },
    { ...TASK_TEMPLATES[10], s: date_11, e: date_11 },
    { ...TASK_TEMPLATES[11], s: date_12, e: date_12 },
    { ...TASK_TEMPLATES[12], s: start_13, e: end_13 },
    { ...TASK_TEMPLATES[13], s: date_14, e: date_14 },
    { ...TASK_TEMPLATES[14], s: date_15, e: date_15 },
    { ...TASK_TEMPLATES[15], s: date_16, e: date_16 },
    { ...TASK_TEMPLATES[16], s: date_17, e: date_17 },
    { ...TASK_TEMPLATES[17], s: date_18, e: date_18 },
    { ...TASK_TEMPLATES[18], s: date_19, e: date_19 },
    { ...TASK_TEMPLATES[19], s: date_20, e: date_20 },
    { ...TASK_TEMPLATES[20], s: start_21, e: end_21 },
    { ...TASK_TEMPLATES[21], s: start_22, e: end_22 },
    { ...TASK_TEMPLATES[22], s: start_23, e: end_23 },
    { ...TASK_TEMPLATES[23], s: start_24, e: end_24 },

    { ...TASK_TEMPLATES[24], s: develop_starts[1], e: develop_ends[1] },
    { ...TASK_TEMPLATES[25], s: review_starts[1], e: review_ends[1] },
    { ...TASK_TEMPLATES[26], s: multimedia_starts[1], e: multimedia_ends[1] },
    { ...TASK_TEMPLATES[27], s: develop_starts[2], e: develop_ends[2] },
    { ...TASK_TEMPLATES[28], s: review_starts[2], e: review_ends[2] },
    { ...TASK_TEMPLATES[29], s: multimedia_starts[2], e: multimedia_ends[2] },
    { ...TASK_TEMPLATES[30], s: develop_starts[3], e: develop_ends[3] },
    { ...TASK_TEMPLATES[31], s: review_starts[3], e: review_ends[3] },
    { ...TASK_TEMPLATES[32], s: multimedia_starts[3], e: multimedia_ends[3] },
    { ...TASK_TEMPLATES[33], s: develop_starts[4], e: develop_ends[4] },
    { ...TASK_TEMPLATES[34], s: review_starts[4], e: review_ends[4] },
    { ...TASK_TEMPLATES[35], s: multimedia_starts[4], e: multimedia_ends[4] },
    { ...TASK_TEMPLATES[36], s: develop_starts[5], e: develop_ends[5] },
    { ...TASK_TEMPLATES[37], s: review_starts[5], e: review_ends[5] },
    { ...TASK_TEMPLATES[38], s: multimedia_starts[5], e: multimedia_ends[5] },
    { ...TASK_TEMPLATES[39], s: develop_starts[6], e: develop_ends[6] },
    { ...TASK_TEMPLATES[40], s: review_starts[6], e: review_ends[6] },
    { ...TASK_TEMPLATES[41], s: multimedia_starts[6], e: multimedia_ends[6] },
    { ...TASK_TEMPLATES[42], s: develop_starts[7], e: develop_ends[7] },
    { ...TASK_TEMPLATES[43], s: review_starts[7], e: review_ends[7] },
    { ...TASK_TEMPLATES[44], s: multimedia_starts[7], e: multimedia_ends[7] },

    { ...TASK_TEMPLATES[45], s: start_46, e: end_46 },
    { ...TASK_TEMPLATES[46], s: start_47, e: end_47 },
    { ...TASK_TEMPLATES[47], s: date_48, e: date_48 },
    { ...TASK_TEMPLATES[48], s: date_49, e: date_49 },
    { ...TASK_TEMPLATES[49], s: date_50, e: date_50 },
    { ...TASK_TEMPLATES[50], s: start_51, e: end_51 },
    { ...TASK_TEMPLATES[51], s: date_52, e: date_52 },
    { ...TASK_TEMPLATES[52], s: start_53, e: end_53 },
    { ...TASK_TEMPLATES[53], s: start_54, e: end_54 },
    { ...TASK_TEMPLATES[54], s: start_55, e: end_55 },
    { ...TASK_TEMPLATES[55], s: date_56, e: date_56 },
    { ...TASK_TEMPLATES[56], s: start_57, e: end_57 },
    { ...TASK_TEMPLATES[57], s: date_58, e: date_58 },
    { ...TASK_TEMPLATES[58], s: date_59, e: date_59 },
    { ...TASK_TEMPLATES[59], s: date_60, e: date_60 },
    { ...TASK_TEMPLATES[60], s: date_61, e: date_61 },
    { ...TASK_TEMPLATES[61], s: start_62, e: end_62 },
    { ...TASK_TEMPLATES[62], s: date_63, e: date_63 },
    { ...TASK_TEMPLATES[63], s: date_64, e: date_64 },
  ];

  return rawTemplates.map((tmp) => makeTask(tmp, onboarding));
}
