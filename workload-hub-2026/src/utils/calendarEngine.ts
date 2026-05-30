import { CourseDevelopmentTask } from '../types';

export const FSCJ_HOLIDAYS = [
  '2026-01-01', '2026-01-19', '2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', 
  '2026-03-13', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-11', 
  '2026-11-26', '2026-11-27', '2026-12-24', '2026-12-25', '2026-12-28', '2026-12-29', 
  '2026-12-30', '2026-12-31', '2027-01-01'
];

export const TASK_TEMPLATES = [
  { id: 1, phase: 'Milestone', name: 'Start compensation', assignedTo: 'Operations' as const, durationDays: 1, isOb: true },
  { id: 2, phase: 'Project Management', name: 'Send SME introduction email [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, isOb: true },
  { id: 3, phase: 'Discovery & Planning', name: 'Schedule onboarding meeting [Calendar] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, isOb: true },
  { id: 4, phase: 'Discovery & Planning', name: 'Customize onboarding presentation', assignedTo: 'Instructional Designer' as const, durationDays: 1, isOb: true },
  { id: 5, phase: 'Discovery & Planning', name: 'Send onboarding reminder [Email] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, isOb: true },
  { id: 6, phase: 'Milestone', name: 'Conduct onboarding meeting, then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, isOb: true },
  { id: 7, phase: 'Project Management', name: 'Finalize timeline', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 8, phase: 'Project Management', name: 'Request initial meeting [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 9, phase: 'Project Management', name: 'Create course development tasks [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 10, phase: 'Project Management', name: 'Obtain course outline', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 11, phase: 'Milestone', name: 'Conduct initial meeting, then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 12, phase: 'Course Design', name: 'Draft Course Design Plan', assignedTo: 'Subject Matter Expert' as const, durationDays: 1 },
  { id: 13, phase: 'Course Design', name: 'Finalize Course Design Plan', assignedTo: 'Instructional Designer' as const, durationDays: 5 },
  { id: 14, phase: 'Project Management', name: 'Schedule kickoff meeting [Calendar]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 15, phase: 'Course Design', name: 'Complete Course Design Plan', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 16, phase: 'Project Management', name: 'Analyze instructional material accessibility', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 17, phase: 'Stakeholder Engagement', name: 'Send kickoff reminder and agenda [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 18, phase: 'Milestone', name: 'Conduct kickoff meeting, then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 19, phase: 'Project Management', name: 'Schedule midpoint review [Calendar] ', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 20, phase: 'Project Management', name: 'Enter instructional materials [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 21, phase: 'Course Development', name: 'Create module templates', assignedTo: 'Instructional Designer' as const, durationDays: 4 },
  { id: 22, phase: 'Project Management', name: 'Coordinate module delivery schedule [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 4 },
  { id: 23, phase: 'Project Management', name: 'Configure calendar reminders [Calendar] ', assignedTo: 'Instructional Designer' as const, durationDays: 4 },
  { id: 24, phase: 'Project Management', name: 'Request Canvas shell [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 25, phase: 'Course Development', name: 'Develop Module 1 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5 },
  { id: 26, phase: 'Course Development', name: 'Review & Build Module 1 content', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 27, phase: 'Course Development', name: 'Develop Module 1 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10 },
  { id: 28, phase: 'Course Development', name: 'Develop Module 2 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5 },
  { id: 29, phase: 'Course Development', name: 'Review & Build Module 2 content', assignedTo: 'Multimedia' as const, durationDays: 1 },
  { id: 30, phase: 'Course Development', name: 'Develop Module 2 multimedia', assignedTo: 'Instructional Designer' as const, durationDays: 10 },
  { id: 31, phase: 'Course Development', name: 'Develop Module 3 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5 },
  { id: 32, phase: 'Course Development', name: 'Review & Build Module 3 content', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 33, phase: 'Course Development', name: 'Develop Module 3 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10 },
  { id: 34, phase: 'Course Development', name: 'Develop Module 4 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5 },
  { id: 35, phase: 'Course Development', name: 'Review & Build Module 4 content', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 36, phase: 'Course Development', name: 'Develop Module 4 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10 },
  { id: 37, phase: 'Course Development', name: 'Develop Module 5 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5 },
  { id: 38, phase: 'Course Development', name: 'Review & Build Module 5 content', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 39, phase: 'Course Development', name: 'Develop Module 5 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10 },
  { id: 40, phase: 'Course Development', name: 'Develop Module 6 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5 },
  { id: 41, phase: 'Course Development', name: 'Review & Build Module 6 content', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 42, phase: 'Course Development', name: 'Develop Module 6 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10 },
  { id: 43, phase: 'Course Development', name: 'Develop Module 7 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5 },
  { id: 44, phase: 'Course Development', name: 'Review & Build Module 7 content', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 45, phase: 'Course Development', name: 'Develop Module 7 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10 },
  { id: 46, phase: 'Course Development', name: 'Finalize course documents', assignedTo: 'Subject Matter Expert' as const, durationDays: 3 },
  { id: 47, phase: 'Project Management', name: 'Send midpoint reminder and agenda [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 48, phase: 'Milestone', name: 'Conduct midpoint review, and then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 49, phase: 'Project Management', name: 'Schedule final review [Calendar]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 50, phase: 'Quality Assurance', name: 'Submit proofreading request [Quickbase]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 51, phase: 'Quality Assurance', name: 'Complete proofreading [Quality Assurance]', assignedTo: 'Quality Assurance' as const, durationDays: 5 },
  { id: 52, phase: 'Quality Assurance', name: 'Complete pre-QA checklist', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 53, phase: 'Quality Assurance', name: 'Assign QA reviewer', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 54, phase: 'Quality Assurance', name: 'Request QA review [Quickbase]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 55, phase: 'Quality Assurance', name: 'Complete QA review', assignedTo: 'Quality Assurance' as const, durationDays: 5 },
  { id: 56, phase: 'Quality Assurance', name: 'Address QA findings', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 57, phase: 'Project Management', name: 'Send final review reminder and agenda', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 58, phase: 'Milestone', name: 'Conduct final review, then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 59, phase: 'Project Closeout', name: 'Send stipend notification [Email] ', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 60, phase: 'Project Closeout', name: 'Request stipend completion [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 61, phase: 'Project Closeout', name: 'Request code check and archive [Quickbase]', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 62, phase: 'Project Closeout', name: 'Complete code check and archive', assignedTo: 'Multimedia' as const, durationDays: 5 },
  { id: 63, phase: 'Project Closeout', name: 'Request course completion [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1 },
  { id: 64, phase: 'Milestone', name: 'Send project completion notification [Email] ', assignedTo: 'Instructional Designer' as const, durationDays: 1 }
];

export function formatDate(dateObj: Date): string {
  const yr = dateObj.getFullYear();
  const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dy = String(dateObj.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00');
}

export function getSummerBounds(year: number) {
  // First week in May starts around May 1st, so first Monday in May
  const dStart = new Date(year, 4, 1, 12, 0, 0);
  while (dStart.getDay() !== 1) {
    dStart.setDate(dStart.getDate() + 1);
  }
  
  // First week in August, so first Friday in August is the final summer closed day
  const dEnd = new Date(year, 7, 1, 12, 0, 0);
  while (dEnd.getDay() !== 5) {
    dEnd.setDate(dEnd.getDate() + 1);
  }
  
  return {
    start: formatDate(dStart),
    end: formatDate(dEnd)
  };
}

export function isSummerDate(dateStr: string): boolean {
  const dateObj = parseDate(dateStr);
  const year = dateObj.getFullYear();
  const { start, end } = getSummerBounds(year);
  return dateStr >= start && dateStr <= end;
}

export function isWorkingDay(dateStr: string, customBlocked: string[] = []): boolean {
  const d = parseDate(dateStr);
  const day = d.getDay();
  
  if (day === 0 || day === 6) return false; // Weekend
  
  // Summer schedule bounds: colleges closed on Fridays
  if (day === 5 && isSummerDate(dateStr)) {
    return false;
  }
  
  if (FSCJ_HOLIDAYS.includes(dateStr) || customBlocked.includes(dateStr)) {
    return false;
  }
  
  return true;
}

export function stepWorkingDays(startDateStr: string, days: number, direction: number, customBlocked: string[] = []): string {
  let dateObj = parseDate(startDateStr);
  let steps = 0;
  
  // Lands on first available working day in correct direction
  while (!isWorkingDay(formatDate(dateObj), customBlocked)) {
    dateObj.setDate(dateObj.getDate() + direction);
  }
  
  while (steps < days) {
    dateObj.setDate(dateObj.getDate() + direction);
    if (isWorkingDay(formatDate(dateObj), customBlocked)) {
      steps++;
    }
  }
  return formatDate(dateObj);
}

export function countWorkingDaysBetween(startDateStr: string, endDateStr: string, customBlocked: string[] = []): number {
  if (startDateStr > endDateStr) return 0;
  let current = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  let count = 0;
  
  while (current <= end) {
    if (isWorkingDay(formatDate(current), customBlocked)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function countWorkingHoursInDay(dateStr: string, customBlocked: string[] = []): number {
  if (!isWorkingDay(dateStr, customBlocked)) return 0;
  
  const d = parseDate(dateStr);
  const day = d.getDay();
  
  if (day === 5) {
    // Standard schedules have Friday hours as 4 (7:30 AM to 11:30 AM)
    // Summer schedule closed on Friday (which is already excluded in isWorkingDay, returning 0 hours)
    return 4;
  }
  
  // Monday through Thursday is 10 hours (7:30 AM to 5:30 PM)
  return 10;
}

export function calculateTimelineTasks(termDeadline: string, onboarding: boolean, customBlocked: string[] = []): CourseDevelopmentTask[] {
  // Let's implement our precise backward date calculation based on the offsets:
  const anchor = stepWorkingDays(termDeadline, 0, -1, customBlocked); // make sure it's working day
  
  // Task 64: Send project completion notification
  const date_64 = anchor;
  // Task 63: Request course completion
  const date_63 = anchor;
  
  // Task 62: Complete code check and archive (5 days)
  const end_62 = stepWorkingDays(anchor, 1, -1, customBlocked);
  const start_62 = stepWorkingDays(end_62, 4, -1, customBlocked);
  
  // Task 58: Conduct final review (1 day) - Ends 1 day before complete code check begins
  const date_58 = stepWorkingDays(start_62, 1, -1, customBlocked);
  
  // Tasks 59, 60, 61: same day as Task 58
  const date_59 = date_58;
  const date_60 = date_58;
  const date_61 = date_58;
  
  // Task 57: Send final review reminder and agenda (starts 2 days prior to Conduct final review)
  const start_57 = stepWorkingDays(date_58, 2, -1, customBlocked);
  const end_57 = start_57;
  
  // Task 56: Address QA findings (ends on the day of final review start)
  const date_56 = date_58;
  
  // Task 55: Complete QA review (5 days, follows 2 working days before final review)
  const end_55 = stepWorkingDays(date_58, 2, -1, customBlocked);
  const start_55 = stepWorkingDays(end_55, 4, -1, customBlocked);
  
  // Task 52: Complete pre-QA checklist (starts after proofreading, ends 1 working day before Complete QA review starts)
  const date_52 = stepWorkingDays(start_55, 1, -1, customBlocked);
  
  // Task 51: Complete proofreading (5 days)
  const end_51 = stepWorkingDays(date_52, 1, -1, customBlocked);
  const start_51 = stepWorkingDays(end_51, 4, -1, customBlocked);
  
  // Tasks 53 & 54: Same start and deadline as Complete proofreading
  const start_53 = start_51;
  const end_53 = end_51;
  const start_54 = start_51;
  const end_54 = end_51;
  
  // Task 50: Submit proofreading request (ends 1 day before proofreading starts)
  const date_50 = stepWorkingDays(start_51, 1, -1, customBlocked);
  
  // Task 46: Finalize course documents (3 days)
  const end_46 = stepWorkingDays(date_50, 1, -1, customBlocked);
  const start_46 = stepWorkingDays(end_46, 2, -1, customBlocked);
  
  // Modules 7 down to 1 loop
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
    const start_rev = end_rev; // duration 1 day
    
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
    
    // For next module, the review end is start_dev - 1 day
    current_review_end = stepWorkingDays(start_dev, 1, -1, customBlocked);
  }
  
  // Midpoint review tasks:
  const date_48 = stepWorkingDays(review_ends[3], 5, 1, customBlocked);
  const start_47 = stepWorkingDays(date_48, 2, -1, customBlocked);
  const end_47 = start_47;
  const date_49 = stepWorkingDays(date_48, 1, 1, customBlocked);
  
  // Task 21: Create module templates (4 days) - ends 1 working day before Develop Module 1 content starts
  const end_21 = stepWorkingDays(develop_starts[1], 1, -1, customBlocked);
  const start_21 = stepWorkingDays(end_21, 3, -1, customBlocked);
  
  // Tasks 22, 23, 24: Same start and deadline as Create module templates
  const start_22 = start_21; const end_22 = end_21;
  const start_23 = start_21; const end_23 = end_21;
  const start_24 = start_21; const end_24 = end_21;
  
  // Task 15: Complete Course Design plan (starts before Create module templates)
  const date_15 = stepWorkingDays(start_21, 1, -1, customBlocked);
  
  // Task 16: Analyze instructional material accessibility (dependent on Complete Course Design Plan deadline)
  const date_16 = stepWorkingDays(date_15, 1, 1, customBlocked);
  
  // Task 13: Finalize Course Design plan (5 days)
  const end_13 = stepWorkingDays(date_15, 1, -1, customBlocked);
  const start_13 = stepWorkingDays(end_13, 4, -1, customBlocked);
  
  // Task 12: Draft Course Design plan (1 day)
  const date_12 = stepWorkingDays(start_13, 1, -1, customBlocked);
  
  // Task 14: Schedule kickoff meeting (same day as Draft Course Design Plan)
  const date_14 = date_12;
  
  // Task 18: Conduct kickoff meeting (follows 5 days after Schedule kickoff meeting starts)
  const date_18 = stepWorkingDays(date_14, 5, 1, customBlocked);
  
  // Task 17: Send kickoff reminder and agenda (starts 2 days prior to Conduct kickoff meeting)
  const date_17 = stepWorkingDays(date_18, 2, -1, customBlocked);
  
  // Tasks 19 & 20: dependent on Conduct kickoff meeting deadline
  const date_19 = stepWorkingDays(date_18, 1, 1, customBlocked);
  const date_20 = date_19;
  
  // Onboarding / Discovery Tasks (starting from Draft Course Design Plan backwards)
  const date_10 = stepWorkingDays(date_12, 1, -1, customBlocked);
  const date_11 = stepWorkingDays(date_10, 2, 1, customBlocked); // follows 2 days after Obtain course outline
  
  const date_8 = stepWorkingDays(date_11, 5, -1, customBlocked); // Request initial meeting is 5 days before Conduct initial meeting
  const date_9 = date_8;
  
  const date_2 = stepWorkingDays(date_8, 10, -1, customBlocked); // Send introduction is 10 days before Request initial meeting
  const date_7 = stepWorkingDays(date_2, 3, 1, customBlocked); // Finalize timeline is 3 days after SME Intro Email
  const date_1 = stepWorkingDays(date_2, 3, -1, customBlocked); // Start compensation is 3 days before SME intro Email
  
  const date_3 = date_2; // Onboarding meeting template schedule
  const date_4 = date_2; // Onboarding presentation customize
  
  const date_6 = stepWorkingDays(date_3, 5, 1, customBlocked); // Onboarding meeting happens 5 days after Schedule
  const date_5 = stepWorkingDays(date_6, 2, -1, customBlocked); // Reminder is 2 days before onboarding meeting

  const rawTemplates = [
    { id: 1, phase: 'Milestone', name: 'Start compensation', assignedTo: 'Operations' as const, durationDays: 1, s: date_1, e: date_1, isOb: true },
    { id: 2, phase: 'Project Management', name: 'Send SME introduction email [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_2, e: date_2, isOb: true },
    { id: 3, phase: 'Discovery & Planning', name: 'Schedule onboarding meeting [Calendar] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_3, e: date_3, isOb: true },
    { id: 4, phase: 'Discovery & Planning', name: 'Customize onboarding presentation', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_4, e: date_4, isOb: true },
    { id: 5, phase: 'Discovery & Planning', name: 'Send onboarding reminder [Email] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_5, e: date_5, isOb: true },
    { id: 6, phase: 'Milestone', name: 'Conduct onboarding meeting, then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_6, e: date_6, isOb: true },
    { id: 7, phase: 'Project Management', name: 'Finalize timeline', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_7, e: date_7 },
    { id: 8, phase: 'Project Management', name: 'Request initial meeting [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_8, e: date_8 },
    { id: 9, phase: 'Project Management', name: 'Create course development tasks [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_9, e: date_9 },
    { id: 10, phase: 'Project Management', name: 'Obtain course outline', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_10, e: date_10 },
    { id: 11, phase: 'Milestone', name: 'Conduct initial meeting, then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_11, e: date_11 },
    { id: 12, phase: 'Course Design', name: 'Draft Course Design Plan', assignedTo: 'Subject Matter Expert' as const, durationDays: 1, s: date_12, e: date_12 },
    { id: 13, phase: 'Course Design', name: 'Finalize Course Design Plan', assignedTo: 'Instructional Designer' as const, durationDays: 5, s: start_13, e: end_13 },
    { id: 14, phase: 'Project Management', name: 'Schedule kickoff meeting [Calendar]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_14, e: date_14 },
    { id: 15, phase: 'Course Design', name: 'Complete Course Design Plan', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_15, e: date_15 },
    { id: 16, phase: 'Project Management', name: 'Analyze instructional material accessibility', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_16, e: date_16 },
    { id: 17, phase: 'Stakeholder Engagement', name: 'Send kickoff reminder and agenda [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_17, e: date_17 },
    { id: 18, phase: 'Milestone', name: 'Conduct kickoff meeting, then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_18, e: date_18 },
    { id: 19, phase: 'Project Management', name: 'Schedule midpoint review [Calendar] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_19, e: date_19 },
    { id: 20, phase: 'Project Management', name: 'Enter instructional materials [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_20, e: date_20 },
    { id: 21, phase: 'Course Development', name: 'Create module templates', assignedTo: 'Instructional Designer' as const, durationDays: 4, s: start_21, e: end_21 },
    { id: 22, phase: 'Project Management', name: 'Coordinate module delivery schedule [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 4, s: start_22, e: end_22 },
    { id: 23, phase: 'Project Management', name: 'Configure calendar reminders [Calendar] ', assignedTo: 'Instructional Designer' as const, durationDays: 4, s: start_23, e: end_23 },
    { id: 24, phase: 'Project Management', name: 'Request Canvas shell [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: start_24, e: end_24 },
    
    // Modules 1 to 7
    { id: 25, phase: 'Course Development', name: 'Develop Module 1 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5, s: develop_starts[1], e: develop_ends[1] },
    { id: 26, phase: 'Course Development', name: 'Review & Build Module 1 content', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: review_starts[1], e: review_ends[1] },
    { id: 27, phase: 'Course Development', name: 'Develop Module 1 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10, s: multimedia_starts[1], e: multimedia_ends[1] },
    
    { id: 28, phase: 'Course Development', name: 'Develop Module 2 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5, s: develop_starts[2], e: develop_ends[2] },
    { id: 29, phase: 'Course Development', name: 'Review & Build Module 2 content', assignedTo: 'Multimedia' as const, durationDays: 1, s: review_starts[2], e: review_ends[2] },
    { id: 30, phase: 'Course Development', name: 'Develop Module 2 multimedia', assignedTo: 'Instructional Designer' as const, durationDays: 10, s: multimedia_starts[2], e: multimedia_ends[2] },
    
    { id: 31, phase: 'Course Development', name: 'Develop Module 3 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5, s: develop_starts[3], e: develop_ends[3] },
    { id: 32, phase: 'Course Development', name: 'Review & Build Module 3 content', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: review_starts[3], e: review_ends[3] },
    { id: 33, phase: 'Course Development', name: 'Develop Module 3 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10, s: multimedia_starts[3], e: multimedia_ends[3] },
    
    { id: 34, phase: 'Course Development', name: 'Develop Module 4 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5, s: develop_starts[4], e: develop_ends[4] },
    { id: 35, phase: 'Course Development', name: 'Review & Build Module 4 content', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: review_starts[4], e: review_ends[4] },
    { id: 36, phase: 'Course Development', name: 'Develop Module 4 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10, s: multimedia_starts[4], e: multimedia_ends[4] },
    
    { id: 37, phase: 'Course Development', name: 'Develop Module 5 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5, s: develop_starts[5], e: develop_ends[5] },
    { id: 38, phase: 'Course Development', name: 'Review & Build Module 5 content', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: review_starts[5], e: review_ends[5] },
    { id: 39, phase: 'Course Development', name: 'Develop Module 5 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10, s: multimedia_starts[5], e: multimedia_ends[5] },
    
    { id: 40, phase: 'Course Development', name: 'Develop Module 6 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5, s: develop_starts[6], e: develop_ends[6] },
    { id: 41, phase: 'Course Development', name: 'Review & Build Module 6 content', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: review_starts[6], e: review_ends[6] },
    { id: 42, phase: 'Course Development', name: 'Develop Module 6 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10, s: multimedia_starts[6], e: multimedia_ends[6] },
    
    { id: 43, phase: 'Course Development', name: 'Develop Module 7 content', assignedTo: 'Subject Matter Expert' as const, durationDays: 5, s: develop_starts[7], e: develop_ends[7] },
    { id: 44, phase: 'Course Development', name: 'Review & Build Module 7 content', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: review_starts[7], e: review_ends[7] },
    { id: 45, phase: 'Course Development', name: 'Develop Module 7 multimedia', assignedTo: 'Multimedia' as const, durationDays: 10, s: multimedia_starts[7], e: multimedia_ends[7] },
    
    { id: 46, phase: 'Course Development', name: 'Finalize course documents', assignedTo: 'Subject Matter Expert' as const, durationDays: 3, s: start_46, e: end_46 },
    { id: 47, phase: 'Project Management', name: 'Send midpoint reminder and agenda [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: start_47, e: end_47 },
    { id: 48, phase: 'Milestone', name: 'Conduct midpoint review, and then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_48, e: date_48 },
    { id: 49, phase: 'Project Management', name: 'Schedule final review [Calendar]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_49, e: date_49 },
    { id: 50, phase: 'Quality Assurance', name: 'Submit proofreading request [Quickbase]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_50, e: date_50 },
    { id: 51, phase: 'Quality Assurance', name: 'Complete proofreading [Quality Assurance]', assignedTo: 'Quality Assurance' as const, durationDays: 5, s: start_51, e: end_51 },
    { id: 52, phase: 'Quality Assurance', name: 'Complete pre-QA checklist', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_52, e: date_52 },
    { id: 53, phase: 'Quality Assurance', name: 'Assign QA reviewer', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: start_53, e: end_53 },
    { id: 54, phase: 'Quality Assurance', name: 'Request QA review [Quickbase]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: start_54, e: end_54 },
    { id: 55, phase: 'Quality Assurance', name: 'Complete QA review', assignedTo: 'Quality Assurance' as const, durationDays: 5, s: start_55, e: end_55 },
    { id: 56, phase: 'Quality Assurance', name: 'Address QA findings', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_56, e: date_56 },
    { id: 57, phase: 'Project Management', name: 'Send final review reminder and agenda', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: start_57, e: end_57 },
    { id: 58, phase: 'Milestone', name: 'Conduct final review, then Send recap [Email]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_58, e: date_58 },
    { id: 59, phase: 'Project Closeout', name: 'Send stipend notification [Email] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_59, e: date_59 },
    { id: 60, phase: 'Project Closeout', name: 'Request stipend completion [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_60, e: date_60 },
    { id: 61, phase: 'Project Closeout', name: 'Request code check and archive [Quickbase]', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_61, e: date_61 },
    { id: 62, phase: 'Project Closeout', name: 'Complete code check and archive', assignedTo: 'Multimedia' as const, durationDays: 5, s: start_62, e: end_62 },
    { id: 63, phase: 'Project Closeout', name: 'Request course completion [Quickbase] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_63, e: date_63 },
    { id: 64, phase: 'Milestone', name: 'Send project completion notification [Email] ', assignedTo: 'Instructional Designer' as const, durationDays: 1, s: date_64, e: date_64 }
  ];

  return rawTemplates.map(tmp => {
    const isOb = !!tmp.isOb;
    if (isOb && !onboarding) {
      return {
        id: tmp.id,
        phase: tmp.phase,
        name: tmp.name,
        assignedTo: tmp.assignedTo,
        status: 'Not Applicable' as const,
        startDate: '',
        dueDate: '',
        durationDays: 0
      };
    }
    return {
      id: tmp.id,
      phase: tmp.phase,
      name: tmp.name,
      assignedTo: tmp.assignedTo,
      status: 'Not Started' as const,
      startDate: tmp.s,
      dueDate: tmp.e,
      durationDays: tmp.durationDays
    };
  });
}
