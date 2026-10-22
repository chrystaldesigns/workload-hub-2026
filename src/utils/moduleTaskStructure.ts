import { CourseDevelopmentTask as Task, CourseDevelopmentSubtask as Subtask } from '../types';
import { stepWorkingDays } from './calendarEngine';

export const DEVELOPMENT_GROUP = 'Develop Modules 1–4 content';
export const REVIEW_GROUP = 'Review & Build Modules 1–4';
export const MULTIMEDIA_EARLY = 'Develop Module 1–4 Multimedia Content';
export const MULTIMEDIA_LATE = 'Develop Modules 5–7 Multimedia Content';
export const DEVELOPMENT_LATE = 'Develop Modules 5–7 content';
export const REVIEW_LATE = 'Review & Build Modules 5–7';
const MODULE_GROUPS = [
  { first: 1, last: 4, development: DEVELOPMENT_GROUP, review: REVIEW_GROUP },
  { first: 5, last: 7, development: DEVELOPMENT_LATE, review: REVIEW_LATE },
] as const;
export const isDevelopmentGroup = (name: string) => MODULE_GROUPS.some((group) => group.development === name);
export const isReviewGroup = (name: string) => MODULE_GROUPS.some((group) => group.review === name);
export const isModuleGroup = (name: string) => isDevelopmentGroup(name) || isReviewGroup(name);
export const MIDPOINT_SCHEDULING_ID = 'schedule-midpoint-review-meeting';
const clean = (name: string) => name.replace(/\s*\[[^\]]*\]\s*$/, '').trim().replace(/, then Send recap$/i, '');
export const shortModuleDate = (date?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || '');
  return match ? `${match[2]}/${match[3]}/${match[1].slice(-2)}` : 'TBD';
};
export const moduleSubtaskId = (kind: 'develop' | 'review' | 'quickbase', module: number) => `${kind}-module-${module}`;
export const subtaskReference = (parent: Task, subtask: Subtask) => `${parent.id}/${subtask.id}`;
export const moduleSubtaskStatus = (subtask: Subtask): Task['status'] => subtask.complete ? 'Complete'
  : subtask.sourceTask?.status === 'Complete' ? 'Not Started' : subtask.sourceTask?.status || 'Not Started';
export function moduleSubtaskLabel(subtask: Subtask): string {
  if (/^Develop Module \d+ multimedia content$/i.test(subtask.title)) {
    return `${subtask.title}: Start ${shortModuleDate(subtask.startDate)}`;
  }
  return `${subtask.title}: Start ${shortModuleDate(subtask.startDate)} — Due ${shortModuleDate(subtask.dueDate)}`;
}

// Expose module milestones to reports and dependency consumers without adding
// their effort to the main-task workload a second time.
export function expandModuleReportTasks(tasks: Task[]): Task[] {
  return tasks.flatMap((parent) => isModuleGroup(parent.name)
    ? (parent.subtasks || []).filter((subtask) => /^(develop|review|quickbase)-module-/.test(subtask.id)).map((subtask) => ({
      ...subtask.sourceTask,
      id: subtaskReference(parent, subtask),
      name: subtask.title,
      phase: parent.phase,
      assignedTo: subtask.assignedTo || subtask.sourceTask?.assignedTo || parent.assignedTo,
      status: moduleSubtaskStatus(subtask),
      startDate: subtask.startDate,
      dueDate: subtask.dueDate,
      durationDays: subtask.durationDays,
      dependencyIds: subtask.dependencyIds || [],
      predecessorIds: subtask.predecessorIds || [],
      reportParentName: parent.name,
    })) : [parent]);
}
export function resolveCourseTaskReference(tasks: Task[], reference: string | number): Task | undefined {
  const main = tasks.find((task) => String(task.id) === String(reference));
  if (main) return main;
  for (const parent of tasks) {
    const subtask = parent.subtasks?.find((item) => subtaskReference(parent, item) === String(reference));
    if (subtask) return { ...subtask.sourceTask, id: String(reference), name: subtask.title,
      phase: parent.phase, assignedTo: subtask.assignedTo || subtask.sourceTask?.assignedTo || parent.assignedTo,
      status: moduleSubtaskStatus(subtask), startDate: subtask.startDate, dueDate: subtask.dueDate,
      dependencyIds: subtask.dependencyIds || [], predecessorIds: subtask.predecessorIds || [] };
  }
  return undefined;
}

// This is a projection on read and on save. Original records remain in
// sourceTask, including historical dates, notes, owners, and nested QB data.
export function migrateModuleTaskStructure(tasks: Task[], blocked: string[] = []): Task[] {
  const find = (name: string) => tasks.find((task) => clean(task.name) === name);
  const replacements = new Map<Task, Task>();
  const removed = new Set<Task>();
  const redirects = new Map<string, string>();
  const quickbaseMilestones = new Map<number, { parent: Task; subtask: Subtask }>();
  // Inclusive ranges: five allocated workdays include the starting day. Shared
  // handoff dates are deliberate; effort and elapsed span are separate values.
  const due = (start: string, effort: number) => start ? stepWorkingDays(start, effort - 1, 1, blocked) : '';
  const snapshot = (old: Task | undefined, previous: Subtask | undefined, title: string, id: string): Subtask => ({
    ...previous,
    id, title,
    complete: previous?.complete ?? (old?.status === 'Complete'),
    details: previous?.details ?? old?.notes ?? '',
    ...(previous?.dependencyIds || old?.dependencyIds ? { dependencyIds: previous?.dependencyIds || old?.dependencyIds } : {}),
    ...(previous?.predecessorIds || old?.predecessorIds ? { predecessorIds: previous?.predecessorIds || old?.predecessorIds } : {}),
    ...(previous?.sourceTask ? {} : old ? { sourceTask: old } : {}),
  });
  const consolidate = (parent: Task | undefined, name: string, subtasks: Subtask[], effort: number, first: number, lastModule: number) => {
    if (!parent) return;
    const existingGroup = parent.name === name;
    const knownTitles = new Set(subtasks.map((subtask) => subtask.title));
    const extras = (parent.subtasks || []).filter((subtask) => !knownTitles.has(subtask.title)
      && !/^(develop|review|quickbase)-module-/.test(subtask.id));
    // Carry other saved children of removed tasks into the live group too.
    const memberPattern = new RegExp(`^${isDevelopmentGroup(name) ? 'Develop' : 'Review & Build'} Module [${first}-${lastModule}] content$`);
    for (const old of tasks.filter((task) => task !== parent && memberPattern.test(clean(task.name)))) {
      for (const child of old.subtasks || []) {
        if (knownTitles.has(child.title)) continue;
        const id = `${old.id}/${child.id}`;
        if (!extras.some((item) => item.id === id)) extras.push({ ...child, id });
      }
    }
    const status = existingGroup ? parent.status : subtasks.filter((item) => item.durationDays).every((item) => item.complete) ? 'Complete'
      : subtasks.some((item) => item.complete || (item.sourceTask && !['Not Started', 'Not Applicable'].includes(item.sourceTask.status))) ? 'In Progress' : parent.status;
    const last = subtasks.at(-1)!;
    replacements.set(parent, { ...parent, name, status, startDate: subtasks[0].startDate, dueDate: last.dueDate,
      durationDays: effort, autoDuration: effort, effectiveDuration: effort, manualDuration: null,
      durationLabel: `${effort} workdays`, subtasks: [...subtasks, ...extras] });
  };
  for (const { first, last, development: developmentName, review: reviewName } of MODULE_GROUPS) {
    const devParent = find(developmentName) || find(`Develop Module ${first} content`);
    const reviewParent = find(reviewName) || find(`Review & Build Module ${first} content`);
    const devSubs: Subtask[] = [];
    const reviewSubs: Subtask[] = [];
    let start = devParent?.startDate || '';
    for (let module = first; module <= last; module++) {
      const devName = `Develop Module ${module} content`;
      const reviewName = `Review & Build Module ${module} content`;
      const qbName = `Enter Module ${module} multimedia task in Quickbase`;
      const oldDev = find(devName);
      const oldReview = find(reviewName);
      const devId = moduleSubtaskId('develop', module);
      const reviewId = moduleSubtaskId('review', module);
      const qbId = moduleSubtaskId('quickbase', module);
      const previousDev = devParent?.subtasks?.find((item) => item.id === devId);
      const previousReview = reviewParent?.subtasks?.find((item) => item.id === reviewId);
      const previousQb = reviewParent?.subtasks?.find((item) => item.id === qbId);
      const originalQb = oldReview?.subtasks?.find((item) => item.title === qbName);
      const development = { ...snapshot(oldDev, previousDev, devName, devId), startDate: start, dueDate: due(start, 5), durationDays: 5, ...(module > first && devParent ? { dependencyIds: [subtaskReference(devParent, devSubs[module - first - 1])] } : {}) };
      const reviewStart = devParent ? development.dueDate : previousReview?.startDate || oldReview?.startDate || '';
      const reviewDue = devParent ? due(reviewStart, 1) : previousReview?.dueDate || oldReview?.dueDate || reviewStart;
      const review = { ...snapshot(oldReview, previousReview, reviewName, reviewId), startDate: reviewStart, dueDate: reviewDue, durationDays: 1, ...(devParent ? { dependencyIds: [subtaskReference(devParent, development)] } : {}) };
      const quickbase = { ...snapshot(undefined, previousQb || originalQb, qbName, qbId), startDate: review.dueDate, dueDate: review.dueDate, durationDays: originalQb?.durationDays || previousQb?.durationDays || 0, ...(reviewParent ? { dependencyIds: [subtaskReference(reviewParent, review)] } : {}), assignedTo: previousQb?.assignedTo || originalQb?.assignedTo || oldReview?.assignedTo || previousReview?.sourceTask?.assignedTo || reviewParent?.assignedTo || 'Instructional Designer' };
      if (devParent) {
        devSubs.push(development);
        if (oldDev) {
          if (oldDev !== devParent) removed.add(oldDev);
          redirects.set(String(oldDev.id), subtaskReference(devParent, development));
        }
      }
      if (reviewParent) {
        reviewSubs.push(review, quickbase);
        quickbaseMilestones.set(module, { parent: reviewParent, subtask: quickbase });
        if (oldReview) {
          if (oldReview !== reviewParent) removed.add(oldReview);
          redirects.set(String(oldReview.id), subtaskReference(reviewParent, review));
        }
      }
      start = development.dueDate;
    }
    consolidate(devParent, developmentName, devSubs, (last - first + 1) * 5, first, last);
    consolidate(reviewParent, reviewName, reviewSubs, last - first + 1, first, last);
  }

  const early = find(MULTIMEDIA_EARLY) || find('Develop Module 1–3 Multimedia Content');
  const late = find(MULTIMEDIA_LATE) || find('Develop Module 5–7 Multimedia Content') || find('Develop Module 4–7 Multimedia Content');
  const multimediaSubs = [...(early?.subtasks || []), ...(late?.subtasks || [])];
  for (const [parent, first, last, name, milestone] of [
    [early, 1, 4, MULTIMEDIA_EARLY, 'Conduct midpoint review'],
    [late, 5, 7, MULTIMEDIA_LATE, 'Conduct final review'],
  ] as const) {
    if (!parent) continue;
    const subtasks: Subtask[] = [];
    for (let module = first; module <= last; module++) {
      const title = `Develop Module ${module} multimedia content`;
      const previous = multimediaSubs.find((subtask) => subtask.title === title);
      const milestone = quickbaseMilestones.get(module);
      const qbStart = milestone?.subtask.startDate;
      subtasks.push({ ...snapshot(undefined, previous, title, `multimedia-module-${module}`),
        ...(qbStart ? { startDate: qbStart } : {}),
        ...(milestone ? { dependencyIds: [subtaskReference(milestone.parent, milestone.subtask)] } : {}) });
    }
    const extras = (parent.subtasks || []).filter((subtask) => !/^Develop Module [1-7] multimedia content$/i.test(subtask.title));
    const review = find(milestone);
    replacements.set(parent, { ...parent, name,
      startDate: subtasks[0]?.startDate || parent.startDate,
      dueDate: review?.dueDate || review?.startDate || parent.dueDate,
      subtasks: [...subtasks, ...extras] });
  }
  const midpoint = find('Conduct midpoint review');
  const midpointLabel = `Schedule midpoint review meeting for the week of ${shortModuleDate(midpoint?.startDate || midpoint?.dueDate)}`;
  const ordered = tasks.filter((task) => !removed.has(task)).map((task) => replacements.get(task) || task);
  const lateDevelopment = ordered.find((task) => task.name === DEVELOPMENT_LATE);
  const lateReview = ordered.find((task) => task.name === REVIEW_LATE);
  if (late && lateDevelopment && lateReview) {
    const multimediaIndex = ordered.findIndex((task) => task.id === late.id);
    if (multimediaIndex >= 0) {
      const [multimedia] = ordered.splice(multimediaIndex, 1);
      ordered.splice(ordered.indexOf(lateReview) + 1, 0, multimedia);
    }
  }
  return ordered.map((task, index) => {
    const redirect = (refs?: Array<string | number>) => refs?.map((ref) => redirects.get(String(ref)) || ref);
    const subtasks = task.subtasks?.map((originalSubtask) => {
      let subtask = originalSubtask;
      if (subtask.title === 'Schedule midpoint meeting' || subtask.id === MIDPOINT_SCHEDULING_ID) {
        subtask = { ...subtask, id: MIDPOINT_SCHEDULING_ID, title: midpointLabel };
      }
      return { ...subtask,
        ...(subtask.dependencyIds ? { dependencyIds: redirect(subtask.dependencyIds) } : {}),
        ...(subtask.predecessorIds ? { predecessorIds: redirect(subtask.predecessorIds) } : {}),
      };
    });
    return { ...task, taskNumber: index + 1,
      ...(subtasks ? { subtasks } : {}),
      ...(task.dependencyIds ? { dependencyIds: redirect(task.dependencyIds) } : {}),
      ...(task.predecessorIds ? { predecessorIds: redirect(task.predecessorIds) } : {}) };
  });
}

export function courseTaskNavigationId(tasks: Task[], reference: string): string {
  const main = tasks.find((task) => String(task.id) === reference);
  if (main) return String(main.id);
  const parent = tasks.find((task) => task.subtasks?.some((subtask) => subtaskReference(task, subtask) === reference
    || (subtask.sourceTask && String(subtask.sourceTask.id) === reference)));
  return parent ? String(parent.id) : reference;
}

export function formatModuleStatusEntry(task: Task & { reportParentName?: string }): string {
  return `- ${task.name} (Parent: ${task.reportParentName}) — ${task.status || 'Not Started'} (start ${shortModuleDate(task.startDate)}, due ${shortModuleDate(task.dueDate)})`;
}
