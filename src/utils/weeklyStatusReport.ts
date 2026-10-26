import type { CourseDevelopment, CourseDevelopmentTask as Task } from '../types';
import { expandModuleReportTasks, shortModuleDate } from './moduleTaskStructure';

export const reportToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(now);

const formatShortDate = (value?: string) => {
  if (!value) return 'TBD';
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', {
    month: '2-digit', day: '2-digit', year: '2-digit',
  });
};
type Role = 'SME' | 'ID' | 'MULTIMEDIA' | 'QA';
const roleMatches = (assignedTo: string | undefined, role: Role) => {
  const owner = (assignedTo || '').toLowerCase();
  if (role === 'SME') return owner.includes('sme') || owner.includes('subject matter') || owner.includes('faculty');
  if (role === 'ID') return owner.includes('instructional') || owner.includes('designer') || owner.includes('id') || owner.includes('chrystal');
  if (role === 'MULTIMEDIA') return owner.includes('multimedia') || owner.includes('mmt') || owner.includes('media');
  return owner.includes('qa') || owner.includes('quality') || owner.includes('assurance');
};

// Restored from b724d63, before the concise weekly redesign. Preserve historical
// inclusion, sorting and formatting; only omit parent references from module lines.
export function generateWeeklyStatusReport(course: CourseDevelopment, progress: number, blocked: string[] = [], now = new Date()) {
  const roleTasks = (role: Role) => expandModuleReportTasks(course.tasks || [])
    .filter(task => roleMatches(task.assignedTo, role) && task.status !== 'Complete' && task.status !== 'Not Applicable')
    .sort((a, b) => (a.dueDate || a.startDate || '9999-12-31').localeCompare(b.dueDate || b.startDate || '9999-12-31'));
  const taskList = (role: Role) => roleTasks(role).map(task => {
    if ((task as Task & { reportParentName?: string }).reportParentName) {
      return `- ${task.name} — ${task.status || 'Not Started'} (start ${shortModuleDate(task.startDate)}, due ${shortModuleDate(task.dueDate)})`;
    }
    const due = task.dueDate || task.startDate;
    return `- ${task.name} — ${task.status || 'Not Started'}${due ? ` (due ${formatShortDate(due)})` : ''}`;
  }).join('\n');
  const findTask = (name: string) => (course.tasks || []).find(task =>
    (task.name || '').trim().toLowerCase() === name.toLowerCase()
    || (course.scheduleVersion === 1 && name.toLowerCase() === 'end compensation' && Number(task.id) === 37));
  const milestone = (label: string, name: string) => {
    const task = findTask(name);
    if (!task) return `${label}: TBD, Not Started`;
    const meeting = task as Task & { meetingTime?: string };
    const showTime = ['ONBOARDING', 'INITIAL MEETING', 'KICKOFF', 'MIDPOINT REVIEW', 'FINAL REVIEW'].includes(label);
    const time = meeting.meetingTime || task.scheduledMeetingTime24;
    const formattedTime = showTime && time ? ` at ${new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
      : showTime && task.scheduledMeetingTimeDisplay ? ` at ${task.scheduledMeetingTimeDisplay}` : '';
    return `${label}: ${formatShortDate(task.dueDate || task.startDate)}${formattedTime}, ${task.status || 'Not Started'}`;
  };
  const milestones = [
    milestone('ONBOARDING', 'Conduct onboarding meeting'),
    milestone('INITIAL MEETING', 'Conduct initial meeting'),
    milestone('COURSE DESIGN PLAN', 'Complete Course Design Plan'),
    milestone('KICKOFF', 'Conduct kickoff meeting'),
    milestone('MIDPOINT REVIEW', 'Conduct midpoint review'),
    milestone('FINAL REVIEW', 'Conduct final review'),
    milestone('SME DELIVERABLES COMPLETE', 'End compensation'),
    milestone('DEVELOPMENT COMPLETION', 'Course completion'),
  ];
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const offTime = blocked.filter(value => {
    const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
    return !Number.isNaN(parsed.getTime()) && parsed > today;
  }).sort().map(value => `- ${formatShortDate(value)}`).join('\n');
  return `Overall Progress: Course design and development is ${progress}% complete.

SUBJECT MATTER EXPERT:
${taskList('SME')}

INSTRUCTIONAL DESIGNER:
${taskList('ID')}

MULTIMEDIA:
${taskList('MULTIMEDIA')}

CEL QUALITY ASSURANCE:
${taskList('QA')}

NOTES: ${course.courseNotes || 'None at this time.'}
ALERTS: ${course.alertStatus || 'No Concerns'}

MILESTONES & OFF-TIME
${milestones.join('\n')}${offTime ? `\n\nCollege Closed / Vacation / Out-of-Office Dates:\n${offTime}` : ''}`;
}
