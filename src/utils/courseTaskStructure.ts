import { migrateModuleTaskStructure } from './moduleTaskStructure';
import { CourseDevelopmentTask, CourseDevelopmentSubtask } from '../types';

export const PROOFREADING_REQUEST = 'Submit proofreading request';
export const COMPLETE_PROOFREADING = 'Complete proofreading';

const taskName = (name: string) => name.replace(/\s*\[[^\]]*\]\s*$/, '').trim().replace(/, then Send recap$/i, '');

export function getProofreadingRequest(tasks: CourseDevelopmentTask[]): CourseDevelopmentTask | undefined {
  const standalone = tasks.find((task) => taskName(task.name) === PROOFREADING_REQUEST);
  const child = tasks.find((task) => taskName(task.name) === COMPLETE_PROOFREADING)?.subtasks?.find((subtask) => subtask.title === PROOFREADING_REQUEST);
  return standalone || (child?.sourceTask && child.autoStartDate ? {...child.sourceTask,startDate:child.startDate,dueDate:child.dueDate} : child?.sourceTask);
}

// IDs remain unchanged so saved edits, dependencies, and dashboard links retain
// their identity. Only the displayed main-task numbers follow the new order.
export function migrateProofreadingTaskStructure(tasks: CourseDevelopmentTask[], renumber = true): CourseDevelopmentTask[] {
  const parent = tasks.find((task) => taskName(task.name) === COMPLETE_PROOFREADING);
  if (!parent) return tasks;
  const request = tasks.find((task) => taskName(task.name) === PROOFREADING_REQUEST);
  const subtasks = parent.subtasks || [];
  const existingRequest = subtasks.find((subtask) => subtask.title === PROOFREADING_REQUEST);
  let moved: CourseDevelopmentSubtask | undefined;
  if (request) {
    moved = {
      ...existingRequest,
      id: existingRequest?.id || 'submit-proofreading-request',
      title: PROOFREADING_REQUEST,
      complete: request.status === 'Complete',
      details: request.notes || '',
      sourceTask: request,
    };
  }
  return tasks.filter((task) => task !== request).map((task, index) => {
    const nextSubtasks = task === parent && moved
      ? [...subtasks.filter((subtask) => subtask.title !== PROOFREADING_REQUEST), moved]
      : task.subtasks;
    if ((!renumber || task.taskNumber === index + 1) && nextSubtasks === task.subtasks) return task;
    return { ...task, ...(renumber ? { taskNumber: index + 1 } : {}), ...(nextSubtasks ? { subtasks: nextSubtasks } : {}) };
  });
}

export const KICKOFF_SCHEDULING_ID = 'schedule-kickoff-meeting';

// Read the actual kickoff milestone so manual date edits and recalculation agree.
export function getKickoffSchedulingWeek(tasks: CourseDevelopmentTask[]): string {
  const kickoff = tasks.find((task) => taskName(task.name) === 'Conduct kickoff meeting');
  const date = (kickoff?.startDate || kickoff?.dueDate || '').slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[2]}/${match[3]}/${match[1].slice(-2)}` : 'TBD';
}

export function migrateKickoffTaskStructure(tasks: CourseDevelopmentTask[], renumber = true): CourseDevelopmentTask[] {
  const parent = tasks.find((task) => taskName(task.name) === 'Conduct initial meeting');
  if (!parent) return tasks;
  const request = tasks.find((task) => taskName(task.name) === 'Schedule kickoff meeting');
  const subtasks = parent.subtasks || [];
  const previous = subtasks.find((subtask) => subtask.id === KICKOFF_SCHEDULING_ID);
  const title = `Schedule kickoff meeting for the week of ${getKickoffSchedulingWeek(tasks)}`;
  const moved: CourseDevelopmentSubtask = {
    ...previous,
    id: KICKOFF_SCHEDULING_ID,
    title,
    complete: previous?.complete ?? (request?.status === 'Complete'),
    details: previous?.details ?? (request?.notes && !/^Schedule meeting the week of /.test(request.notes) ? request.notes : ''),
    ...(request ? { sourceTask: request } : {}),
  };
  const initialTitles = ['Send Initial Meeting Recap', 'Draft Course Design Plan', 'Send Course Design Plan draft to SME'];
  const initialSubtasks = initialTitles.map((title, index) => subtasks.find((subtask) => subtask.title === title)
    || { id: `subtask-${index + 1}`, title, complete: false, details: '' });
  const nextSubtasks = [...initialSubtasks, moved,
    ...subtasks.filter((subtask) => subtask.id !== KICKOFF_SCHEDULING_ID && !initialTitles.includes(subtask.title))];
  return tasks.filter((task) => task !== request).map((task, index) => {
    if (task !== parent) return !renumber || task.taskNumber === index + 1 ? task : { ...task, taskNumber: index + 1 };
    if (!request && (!renumber || task.taskNumber === index + 1) && task.durationDays === 1 && task.durationLabel === '1 day'
      && JSON.stringify(subtasks) === JSON.stringify(nextSubtasks)) return task;
    return { ...task, ...(renumber ? { taskNumber: index + 1 } : {}), durationDays: 1, durationLabel: '1 day', subtasks: nextSubtasks };
  });
}

export function migrateCourseTaskStructure(tasks: CourseDevelopmentTask[], customBlocked: string[] = []): CourseDevelopmentTask[] {
  return migrateModuleTaskStructure(migrateKickoffTaskStructure(migrateProofreadingTaskStructure(tasks, false), false), customBlocked);
}
