import type { CourseDevelopment, CourseDevelopmentTask } from '../types';
import { recalculateCourse } from './forwardSchedule';
import { migrateCourseTaskStructure } from './courseTaskStructure';
import { validISODate, type TermPlanningSettings } from './termPlanning';

export function courseProjectStart(course: CourseDevelopment) {
  return course.projectStartDate || course.tasks.find(task => Number(task.id) === (course.onboarding ? 2 : 5))?.startDate || '';
}

type DatedItem = Pick<CourseDevelopmentTask, 'startDate'|'dueDate'|'manualStartDate'|'manualDueDate'|'isManualOverride'>;
function retainedOverrides(item: DatedItem, original?: DatedItem, releaseMigrationPins = false, completed = false) {
  const result: {manualStartDate?: string|null;manualDueDate?: string|null} = {};
  for (const [manual, field] of [['manualStartDate','startDate'],['manualDueDate','dueDate']] as const) {
    const value = item[manual];
    // Previous adoption copied every projected date into manual fields. Release only
    // values traceable to that snapshot, never explicit flags, original overrides,
    // changed overrides, or completed/historical work.
    if (releaseMigrationPins && value && value === original?.[field] && !original?.[manual] && !item.isManualOverride && !completed) result[manual] = null;
    else if (!value && (item.isManualOverride || completed) && item[field]) result[manual] = item[field];
  }
  return result;
}

export function prepareCourseSchedule(course: CourseDevelopment, start: string, settings?: TermPlanningSettings, customBlocked: string[] = []): CourseDevelopment {
  if (!course.id) throw new Error('Select a saved course before updating its schedule.');
  if (!validISODate(start) || Number(start.slice(0,4)) < 1900 || Number(start.slice(0,4)) > 9999) throw new Error('Enter a valid Project Start Date (YYYY-MM-DD), then save again.');
  const legacy = course.scheduleVersion !== 1;
  const originalTasks = course.legacyScheduleSnapshot;
  const releaseMigrationPins = !legacy && !!originalTasks && !course.scheduleOverrideVersion;
  const tasks = (legacy ? migrateCourseTaskStructure(structuredClone(course.tasks),customBlocked) : course.tasks).map(task => {
    if (Number(task.id) === 1) return structuredClone(task);
    const original = originalTasks?.find(t => String(t.id) === String(task.id));
    const beforeMigration = course.tasks.find(t => String(t.id) === String(task.id));
    const completed = task.status === 'Complete' || !!task.completionDate;
    const datedTask = legacy && completed && beforeMigration ? {...task,startDate:beforeMigration.startDate,dueDate:beforeMigration.dueDate} : task;
    return {
      ...task,
      ...retainedOverrides(datedTask,original,releaseMigrationPins,completed),
      subtasks: task.subtasks?.map(subtask => {
        const source = original?.subtasks?.find(s => s.id === subtask.id);
        const historical = legacy ? beforeMigration?.subtasks?.find(s => s.id === subtask.id || s.title === subtask.title) || subtask.sourceTask : undefined;
        const datedSubtask = historical ? {...subtask,
          manualStartDate:subtask.manualStartDate ?? historical.manualStartDate,
          manualDueDate:subtask.manualDueDate ?? historical.manualDueDate,
          ...(completed || subtask.complete ? {startDate:historical.startDate,dueDate:historical.dueDate} : {}),
        } : subtask;
        return {...subtask,...retainedOverrides(datedSubtask,source,releaseMigrationPins,completed || subtask.complete)};
      }),
    };
  });
  const scheduled = recalculateCourse({
    ...course,projectStartDate:start,scheduleOverrideVersion:1,tasks,
    ...(legacy && !originalTasks ? {legacyScheduleSnapshot:structuredClone(course.tasks)} : {}),
  },settings,customBlocked);
  return scheduled;
}
