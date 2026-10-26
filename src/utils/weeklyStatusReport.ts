import type { CourseDevelopment, CourseDevelopmentTask as Task } from '../types';
import { shortModuleDate } from './moduleTaskStructure';
import { fscjCalendar, type TermPlanningSettings } from './termPlanning';
import { dayNumber, isoDay, offsetWorkdays } from './fscjCalendar';

export const reportToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now);
const date = (value?: string | null) => value?.slice(0, 10) || '';
const due = (task: Task) => date(task.manualDueDate || task.effectiveDueDate || task.dueDate);
const clean = (name: string) => name.replace(/\s*\[[^\]]*\]\s*$/, '').replace(/, then Send recap$/i, '').trim();
const milestoneDefinitions = [
  ['Onboarding', 'Conduct onboarding meeting'],
  ['Initial Meeting', 'Conduct initial meeting'],
  ['Course Design Plan Due', 'Complete Course Design Plan'],
  ['Kickoff Meeting', 'Conduct kickoff meeting'],
  ['Midpoint Review', 'Conduct midpoint review'],
  ['Final Review', 'Conduct final review'],
  ['Course Completion', 'Course completion'],
];
const owner = (value: string) => ({ SME: 'Subject Matter Expert', ID: 'Instructional Designer', QA: 'CeL Quality Assurance',
  'Quality Assurance': 'CeL Quality Assurance' }[value] || value);

/** Read-only email projection: dates never imply progress or completion. */
export function generateWeeklyStatusReport(course: CourseDevelopment, progress: number, blocked: string[] = [], settings?: TermPlanningSettings, today = reportToday()) {
  const end = offsetWorkdays(today, 10, fscjCalendar(settings, blocked));
  // Seven calendar dates before today, excluding today's still-incomplete day.
  const start = isoDay(dayNumber(today) - 7);
  const milestones = milestoneDefinitions.filter(([label]) => label !== 'Onboarding' || course.onboarding)
    .map(([label, name]) => ({ label, task: course.tasks.find(task => clean(task.name).toLowerCase() === name.toLowerCase()) }));
  const milestoneIds = new Set(milestones.flatMap(({ task }) => task ? [task.id] : []));
  const entries: Task[] = course.tasks.flatMap(parent => {
    if (parent.status === 'Not Applicable' || milestoneIds.has(parent.id)) return [];
    if (!parent.subtasks?.length) return [parent];
    // Report children instead of their summary parent. Never inherit its completion date/status.
    return parent.subtasks.map(sub => ({
      ...sub.sourceTask, id: `${parent.id}/${sub.id}`, name: sub.title, phase: parent.phase,
      assignedTo: sub.assignedTo || sub.sourceTask?.assignedTo || parent.assignedTo,
      status: sub.complete ? 'Complete' : sub.status || (sub.sourceTask?.status === 'Complete' ? 'Not Started' : sub.sourceTask?.status) || 'Not Started',
      dueDate: sub.manualDueDate || sub.dueDate || sub.sourceTask?.dueDate,
      manualDueDate: sub.manualDueDate,
      effectiveDueDate: undefined,
      completionDate: sub.complete ? sub.completionDate || sub.sourceTask?.completionDate : undefined,
    }));
  }).sort((a, b) => (due(a) || '9999').localeCompare(due(b) || '9999'));
  const open = (task: Task) => !['Complete', 'Not Applicable'].includes(task.status);
  const concern = (task: Task) => {
    const labels = ['On Hold', 'Overdue', 'Blocked', 'Submission Late (SME)'].includes(task.status) ? [task.status] : [];
    if (open(task) && due(task) && due(task) < today && !labels.includes('Overdue')) labels.push('Overdue');
    return labels.length ? ` — ${labels.join(', ')}` : '';
  };
  const active = entries.filter(task => open(task) && (['In Progress', 'Developing (Content)', 'Developing (Canvas)'].includes(task.status) || !!concern(task)));
  const activeIds = new Set(active.map(task => task.id));
  const upcoming = entries.filter(task => open(task) && !activeIds.has(task.id) && due(task) >= today && due(task) <= end);
  const completed = entries.filter(task => task.status === 'Complete' && date(task.completionDate) >= start && date(task.completionDate) < today);
  const line = (task: Task, complete = false) => `- ${clean(task.name)}${complete ? ` — Completed ${shortModuleDate(task.completionDate)}` : due(task) ? ` — Due ${shortModuleDate(due(task))}` : ''}${complete ? '' : concern(task)}`;
  const grouped = (tasks: Task[]) => [...new Set(tasks.map(task => owner(task.assignedTo)))].map(role =>
    `${role}:\n${tasks.filter(task => owner(task.assignedTo) === role).map(task => line(task)).join('\n')}`).join('\n\n');
  const milestoneLines = milestones.map(({ label, task }) => {
    if (!task) return `- ${label} — Date TBD`;
    const completed = task.status === 'Complete';
    const when = completed ? task.completionDate || due(task) || task.startDate : due(task) || task.startDate;
    const time = task.scheduledMeetingTimeDisplay || task.scheduledMeetingTime24 || (task as Task & { meetingTime?: string }).meetingTime;
    return `- ${label} — ${completed ? 'Completed ' : ''}${shortModuleDate(when)}${!completed && time ? ` at ${time}` : ''}${completed ? '' : concern(task)}${task.status === 'Not Applicable' ? ' — Not Applicable' : ''}`;
  });
  const sections = [`Overall Progress\nCourse design and development is ${progress}% complete.`];
  if (completed.length) sections.push(`Completed This Week\n${completed.map(task => line(task, true)).join('\n')}`);
  sections.push(`Currently In Progress\n${active.length ? grouped(active) : 'No activities currently in progress.'}`);
  sections.push(`Upcoming Activities\n${upcoming.length ? grouped(upcoming) : 'No activities due within the next 10 FSCJ workdays.'}`);
  sections.push(`Key Milestones\n${milestoneLines.join('\n')}`);
  sections.push(`Alerts\n${course.alertStatus || 'No Concerns'}`);
  if (course.courseNotes?.trim()) sections.push(`Notes\n${course.courseNotes.trim()}`);
  return sections.join('\n\n');
}
