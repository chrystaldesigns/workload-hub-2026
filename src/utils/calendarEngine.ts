import { CourseDevelopmentTask } from "../types";

export const TIMEZONE = "America/New_York";

/**
 * Manual FSCJ-specific closures.
 * Add future Spring Break, Winter Break, or special college closures here.
 * US federal holidays are calculated automatically below.
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

export const FSCJ_HOLIDAYS = [
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-03-09",
  "2026-03-10",
  "2026-03-11",
  "2026-03-12",
  "2026-03-13",
  "2026-05-25",
  "2026-06-19",
  "2026-07-03",
  "2026-09-07",
  "2026-11-11",
  "2026-11-26",
  "2026-11-27",
  "2026-12-24",
  "2026-12-25",
  "2026-12-28",
  "2026-12-29",
  "2026-12-30",
  "2026-12-31",
  "2027-01-01",
];

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

export function formatDate(dateObj: Date): string {
  const yr = dateObj.getFullYear();
  const mo = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dy = String(dateObj.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

export function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date(Number.NaN);
  return new Date(`${dateStr}T12:00:00`);
}

function getNthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  weekday: number,
  nth: number
): string {
  const date = new Date(year, monthIndex, 1, 12, 0, 0);
  let count = 0;

  while (date.getMonth() === monthIndex) {
    if (date.getDay() === weekday) {
      count++;
      if (count === nth) return formatDate(date);
    }
    date.setDate(date.getDate() + 1);
  }

  throw new Error("Unable to calculate nth weekday.");
}

function getLastWeekdayOfMonth(year: number, monthIndex: number, weekday: number): string {
  const date = new Date(year, monthIndex + 1, 0, 12, 0, 0);

  while (date.getMonth() === monthIndex) {
    if (date.getDay() === weekday) return formatDate(date);
    date.setDate(date.getDate() - 1);
  }

  throw new Error("Unable to calculate last weekday.");
}

function getObservedFixedHoliday(year: number, monthIndex: number, day: number): string {
  const actual = new Date(year, monthIndex, day, 12, 0, 0);
  const weekday = actual.getDay();

  if (weekday === 6) {
    actual.setDate(actual.getDate() - 1);
  } else if (weekday === 0) {
    actual.setDate(actual.getDate() + 1);
  }

  return formatDate(actual);
}

export function getFederalHolidaysForYear(year: number): string[] {
  return [
    getObservedFixedHoliday(year, 0, 1),
    getNthWeekdayOfMonth(year, 0, 1, 3),
    getNthWeekdayOfMonth(year, 1, 1, 3),
    getLastWeekdayOfMonth(year, 4, 1),
    getObservedFixedHoliday(year, 5, 19),
    getObservedFixedHoliday(year, 6, 4),
    getNthWeekdayOfMonth(year, 8, 1, 1),
    getObservedFixedHoliday(year, 10, 11),
    getNthWeekdayOfMonth(year, 10, 4, 4),
    stepCalendarDays(getNthWeekdayOfMonth(year, 10, 4, 4), 1),
    getObservedFixedHoliday(year, 11, 25),
  ];
}

export function getCollegeClosuresForYear(year: number): string[] {
  return [
    ...getFederalHolidaysForYear(year),
    ...(FSCJ_MANUAL_CLOSURES[String(year)] || []),
  ];
}

export function stepCalendarDays(startDateStr: string, days: number): string {
  const date = parseDate(startDateStr);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date supplied to stepCalendarDays: ${startDateStr}`);
  }

  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function getSummerBounds(year: number) {
  return {
    start: `${year}-05-04`,
    end: `${year}-08-08`,
  };
}

export function isSummerDate(dateStr: string): boolean {
  const dateObj = parseDate(dateStr);
  if (Number.isNaN(dateObj.getTime())) return false;

  const year = dateObj.getFullYear();
  const { start, end } = getSummerBounds(year);

  return dateStr >= start && dateStr <= end;
}

export function isCollegeClosure(dateStr: string, customBlocked: string[] = []): boolean {
  const d = parseDate(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  const year = d.getFullYear();

  return (
    getCollegeClosuresForYear(year).includes(dateStr) ||
    customBlocked.includes(dateStr)
  );
}

export function isWorkingDay(dateStr: string, customBlocked: string[] = []): boolean {
  const d = parseDate(dateStr);
  if (Number.isNaN(d.getTime())) return false;

  const day = d.getDay();

  if (day === 0 || day === 6) return false;

  if (day === 5 && isSummerDate(dateStr)) {
    return false;
  }

  if (isCollegeClosure(dateStr, customBlocked)) {
    return false;
  }

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

  const d = parseDate(dateStr);
  const day = d.getDay();

  if (day === 5) return 4;

  return 10;
}

export function calculateDeadlineFromTermStart(
  termStartDate: string,
  customBlocked: string[] = []
): string {
  return stepWorkingDays(termStartDate, 30, -1, customBlocked);
}

export function calculateTimelineTasks(
  termDeadline: string,
  onboarding: boolean,
  customBlocked: string[] = []
): CourseDevelopmentTask[] {
  const anchor = stepWorkingDays(termDeadline, 0, -1, customBlocked);

  const rawTemplates = TASK_TEMPLATES.map((template) => ({
    ...template,
    s: anchor,
    e: anchor,
  }));

  return rawTemplates.map((tmp) => {
    const isOnboardingTask = !!tmp.isOb;

    if (isOnboardingTask && !onboarding) {
      return {
        id: tmp.id,
        phase: tmp.phase,
        name: tmp.name,
        assignedTo: tmp.assignedTo,
        roleOwner: tmp.assignedTo,
        status: "Not Applicable" as const,
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
      status: "Not Started" as const,
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
  });
}
