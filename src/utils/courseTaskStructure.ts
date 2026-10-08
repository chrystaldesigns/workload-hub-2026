import { CourseDevelopmentTask, CourseDevelopmentSubtask } from '../types';

export const PROOFREADING_REQUEST = 'Submit proofreading request';
export const COMPLETE_PROOFREADING = 'Complete proofreading';

const taskName = (name: string) => name.replace(/\s*\[[^\]]*\]\s*$/, '').trim();

export function getProofreadingRequest(tasks: CourseDevelopmentTask[]): CourseDevelopmentTask | undefined {
  return tasks.find((task) => taskName(task.name) === PROOFREADING_REQUEST)
    || tasks.find((task) => taskName(task.name) === COMPLETE_PROOFREADING)
      ?.subtasks?.find((subtask) => subtask.title === PROOFREADING_REQUEST)?.sourceTask;
}

// IDs remain unchanged so saved edits, dependencies, and dashboard links retain
// their identity. Only the displayed main-task numbers follow the new order.
export function migrateProofreadingTaskStructure(tasks: CourseDevelopmentTask[]): CourseDevelopmentTask[] {
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
    if (task.taskNumber === index + 1 && nextSubtasks === task.subtasks) return task;
    return { ...task, taskNumber: index + 1, ...(nextSubtasks ? { subtasks: nextSubtasks } : {}) };
  });
}
