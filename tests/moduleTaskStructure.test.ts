import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CourseDevelopment, CourseDevelopmentTask as Task } from '../src/types';
import { Category1CourseDev, buildCourseDevelopmentTimeline, mergeRecalculatedTimeline } from '../src/components/Category1_CourseDev';
import { SmeReviewEmailDialog } from '../src/components/SmeReviewEmailDialog';
import { migrateCourseTaskStructure } from '../src/utils/courseTaskStructure';
import { countWorkingDaysBetween, stepWorkingDays } from '../src/utils/calendarEngine';
import {
  DEVELOPMENT_GROUP, REVIEW_GROUP, DEVELOPMENT_LATE, REVIEW_LATE, isModuleGroup, MULTIMEDIA_EARLY, MULTIMEDIA_LATE, MIDPOINT_SCHEDULING_ID,
  expandModuleReportTasks, formatModuleStatusEntry, moduleSubtaskLabel,
  resolveCourseTaskReference, courseTaskNavigationId,
} from '../src/utils/moduleTaskStructure';

const build = (blocked: string[] = []) => buildCourseDevelopmentTimeline('2027-05-03', true, blocked);
const named = (tasks: Task[], name: string) => tasks.find((task) => task.name === name)!;
// Reconstruct the exact former hierarchy from the archived standalone records,
// then seed user edits so migration checks do not depend on default statuses.
function legacy() {
  const template = build();
  const tasks = template.flatMap((task) => isModuleGroup(task.name)
    ? task.subtasks!.filter((subtask) => /^(develop|review)-module-/.test(subtask.id)).map((subtask) => structuredClone(subtask.sourceTask!))
    : [structuredClone(task)]).sort((a, b) => Number(a.id) - Number(b.id));
  const early = named(tasks, MULTIMEDIA_EARLY);
  const late = named(tasks, MULTIMEDIA_LATE);
  const module4 = early.subtasks!.find((subtask) => subtask.title === 'Develop Module 4 multimedia content')!;
  early.name = 'Develop Module 1–3 Multimedia Content';
  early.subtasks = early.subtasks!.filter((subtask) => subtask !== module4);
  late.name = 'Develop Module 4–7 Multimedia Content';
  late.subtasks = [{ ...module4, id: 'subtask-1', complete: true, details: 'Module 4 animation notes' }, ...late.subtasks!];
  for (const task of [early, late]) {
    task.notes = `Preserved ${task.name} notes`;
    for (const subtask of task.subtasks!) delete subtask.startDate;
  }
  const kickoff = named(tasks, 'Conduct kickoff meeting');
  kickoff.subtasks = kickoff.subtasks!.map((subtask) => subtask.id === MIDPOINT_SCHEDULING_ID
    ? { ...subtask, id: 'subtask-4', title: 'Schedule midpoint meeting', complete: true } : subtask);
  for (let module = 1; module <= 4; module++) {
    const develop = named(tasks, `Develop Module ${module} content`);
    Object.assign(develop, { status: module === 2 ? 'Complete' : 'In Progress', notes: `Module ${module} notes`, completionDate: module === 2 ? '2026-10-20' : '', manualStartDate: develop.startDate });
    const review = named(tasks, `Review & Build Module ${module} content`);
    review.subtasks![0] = { ...review.subtasks![0], complete: module === 3, details: `QB ${module} instructions` };
  }
  return tasks.map((task, index) => ({ ...task, taskNumber: index + 1 }));
}

function assertSchedule(tasks: Task[], blocked: string[] = []) {
  const dev = named(tasks, DEVELOPMENT_GROUP);
  const review = named(tasks, REVIEW_GROUP);
  assert.equal(dev.subtasks!.length, 4);
  assert.equal(review.subtasks!.length, 8);
  for (let index = 0; index < 4; index++) {
    const development = dev.subtasks![index];
    const build = review.subtasks![index * 2];
    const qb = review.subtasks![index * 2 + 1];
    assert.equal(development.title, `Develop Module ${index + 1} content`);
    assert.equal(build.title, `Review & Build Module ${index + 1} content`);
    assert.equal(qb.title, `Enter Module ${index + 1} multimedia task in Quickbase`);
    assert.equal(countWorkingDaysBetween(development.startDate!, development.dueDate!, blocked), 5);
    assert.equal(countWorkingDaysBetween(build.startDate!, build.dueDate!, blocked), 1);
    assert.equal(development.durationDays, 5);
    assert.equal(build.durationDays, 1);
    if (index) assert.equal(development.startDate, dev.subtasks![index - 1].dueDate);
    assert.equal(build.startDate, development.dueDate);
    assert.equal(qb.startDate, build.dueDate);
    assert.equal(qb.dueDate, build.dueDate);
    const multimedia = named(tasks, MULTIMEDIA_EARLY).subtasks![index];
    assert.equal(multimedia.startDate, qb.startDate);
    assert.equal(moduleSubtaskLabel(multimedia).includes('Due'), false);
  }
  assert.equal(dev.startDate, dev.subtasks![0].startDate);
  assert.equal(dev.dueDate, dev.subtasks![3].dueDate);
  assert.equal(review.startDate, review.subtasks![0].startDate);
  assert.equal(review.dueDate, review.subtasks![7].dueDate);
  assert.equal(dev.durationDays, 20);
  assert.equal(review.durationDays, 4);
  assert(countWorkingDaysBetween(review.startDate!, review.dueDate!, blocked) > 4);
  assert.equal(named(tasks, MULTIMEDIA_EARLY).dueDate, named(tasks, 'Conduct midpoint review').dueDate);
  assert.equal(named(tasks, MULTIMEDIA_LATE).dueDate, named(tasks, 'Conduct final review').dueDate);
}

test('new projects consolidate in place, keep IDs, schedule inclusive workdays, and do not double-count effort', () => {
  for (const onboarding of [true, false]) {
    const tasks = buildCourseDevelopmentTimeline('2027-05-03', onboarding);
    assertSchedule(tasks);
    assert.equal(tasks.length, 27);
    assert.deepEqual(tasks.map((task) => task.taskNumber), Array.from({ length: 27 }, (_, index) => index + 1));
    assert.equal(named(tasks, DEVELOPMENT_GROUP).id, 13);
    assert.equal(named(tasks, DEVELOPMENT_GROUP).taskNumber, 12);
    assert.equal(named(tasks, REVIEW_GROUP).id, 14);
    assert.equal(named(tasks, REVIEW_GROUP).taskNumber, 13);
    assert(!tasks.some((task) => /^Develop Module [1-4] content$|^Review & Build Module [1-4] content$/.test(task.name)));
    assert.equal(tasks.filter((task) => [DEVELOPMENT_GROUP, REVIEW_GROUP].includes(task.name)).reduce((total, task) => total + task.durationDays!, 0), 24);
    const modules = tasks.flatMap((task) => task.subtasks || []).filter((subtask) => /^Develop Module \d multimedia content$/.test(subtask.title));
    assert.equal(modules.length, 7);
    assert.equal(new Set(modules.map((subtask) => subtask.title)).size, 7);
    assert.equal(named(tasks, MULTIMEDIA_EARLY).subtasks!.length, 4);
    assert.equal(named(tasks, MULTIMEDIA_LATE).subtasks!.length, 3);
  }
});

test('migration preserves complete source records, owner, notes, QB completion, module 4 details, and input immutability', () => {
  const old = legacy();
  const before = JSON.stringify(old);
  const migrated = migrateCourseTaskStructure(old);
  assertSchedule(migrated);
  for (let module = 1; module <= 4; module++) {
    const development = named(migrated, DEVELOPMENT_GROUP).subtasks![module - 1];
    const review = named(migrated, REVIEW_GROUP).subtasks![(module - 1) * 2];
    const qb = named(migrated, REVIEW_GROUP).subtasks![(module - 1) * 2 + 1];
    assert.deepEqual(development.sourceTask, named(old, development.title));
    assert.deepEqual(review.sourceTask, named(old, review.title));
    assert.equal(development.complete, module === 2);
    assert.equal(development.details, `Module ${module} notes`);
    assert.equal(qb.complete, module === 3);
    assert.equal(qb.details, `QB ${module} instructions`);
  }
  const moved = named(migrated, MULTIMEDIA_EARLY).subtasks![3];
  assert.equal(moved.complete, true);
  assert.equal(moved.details, 'Module 4 animation notes');
  assert.equal(named(migrated, DEVELOPMENT_GROUP).startDate, named(old, 'Develop Module 1 content').startDate);
  assert.equal(JSON.stringify(old), before);
  assert.deepEqual(migrateCourseTaskStructure(JSON.parse(JSON.stringify(migrated))), migrated);
});

test('changed holiday calendar and manual anchor recalculate without resetting saved independent checkboxes', () => {
  for (const start of ['2026-10-29', '2026-11-24', '2026-12-18']) {
    const blocked = ['2026-11-02', '2026-12-21'];
    const tasks = migrateCourseTaskStructure(legacy(), blocked);
    named(tasks, DEVELOPMENT_GROUP).startDate = start;
    named(tasks, DEVELOPMENT_GROUP).subtasks![1].complete = false;
    const shifted = migrateCourseTaskStructure(JSON.parse(JSON.stringify(tasks)), blocked);
    assertSchedule(shifted, blocked);
    assert.equal(named(shifted, DEVELOPMENT_GROUP).subtasks![1].complete, false);
    assert.equal(named(shifted, DEVELOPMENT_GROUP).subtasks![0].dueDate, stepWorkingDays(start, 4, 1, blocked));
    assert.deepEqual(migrateCourseTaskStructure(shifted, blocked), shifted);
  }
});

test('recalculation moves all child dates with the project while retaining edited notes and completion', () => {
  const tasks = migrateCourseTaskStructure(legacy());
  named(tasks, DEVELOPMENT_GROUP).subtasks![1].complete = false;
  named(tasks, REVIEW_GROUP).subtasks![1].details = 'Updated QB instructions';
  named(tasks, 'Complete Course Design Plan').startDate = '2027-02-10';
  named(tasks, 'Complete Course Design Plan').dueDate = '2027-02-10';
  const generated = buildCourseDevelopmentTimeline('2027-07-30', true, ['2027-03-01'], tasks);
  const merged = mergeRecalculatedTimeline(tasks, generated, ['2027-03-01']);
  assertSchedule(merged, ['2027-03-01']);
  assert.notEqual(named(merged, DEVELOPMENT_GROUP).startDate, named(tasks, DEVELOPMENT_GROUP).startDate);
  assert.equal(named(merged, DEVELOPMENT_GROUP).subtasks![1].complete, false);
  assert.equal(named(merged, REVIEW_GROUP).subtasks![1].details, 'Updated QB instructions');
  assert.equal(named(merged, MULTIMEDIA_EARLY).subtasks![3].complete, true);
});

test('midpoint label and multimedia due dates follow their actual milestones on save', () => {
  const tasks = migrateCourseTaskStructure(legacy());
  named(tasks, 'Conduct midpoint review').startDate = '2027-03-17';
  named(tasks, 'Conduct midpoint review').dueDate = '2027-03-17';
  named(tasks, 'Conduct final review').dueDate = '2027-05-18';
  const updated = migrateCourseTaskStructure(tasks);
  const subtask = named(updated, 'Conduct kickoff meeting').subtasks!.find((subtask) => subtask.id === MIDPOINT_SCHEDULING_ID)!;
  assert.equal(subtask.title, 'Schedule midpoint review meeting for the week of 03/17/27');
  assert.equal(subtask.complete, true);
  assert.equal(named(updated, MULTIMEDIA_EARLY).dueDate, '2027-03-17');
  assert.equal(named(updated, MULTIMEDIA_LATE).dueDate, '2027-05-18');
});

test('Status QB projects twelve independent entries with current status, parent, and dates', () => {
  const tasks = migrateCourseTaskStructure(legacy());
  const report = expandModuleReportTasks(tasks);
  const entries = report.filter((task) => /^(Develop|Review & Build|Enter) Module [1-4] (content|multimedia task)/.test(task.name));
  assert.equal(entries.length, 12);
  assert(!report.some((task) => task.name === DEVELOPMENT_GROUP || task.name === REVIEW_GROUP));
  for (const task of entries) {
    const text = formatModuleStatusEntry(task);
    assert(text.includes('Parent: '));
    assert(text.includes('start ') && text.includes('due '));
    assert(text.includes(task.status));
    assert.equal(resolveCourseTaskReference(tasks, task.id)!.dueDate, task.dueDate);
  }
  assert.equal(entries.find((task) => task.name === 'Develop Module 2 content')!.status, 'Complete');
  named(tasks, DEVELOPMENT_GROUP).subtasks![1].complete = false;
  assert.equal(expandModuleReportTasks(tasks).find((task) => task.name === 'Develop Module 2 content')!.status, 'Not Started');
});

test('removed-task dependencies resolve to their own child milestones and old navigation targets find the parent card', () => {
  const old = legacy();
  named(old, 'Create module templates').dependencyIds = [16, 19];
  named(old, 'Review & Build Module 3 content').predecessorIds = [18];
  named(old, 'Conduct midpoint review').predecessorIds = [22, 23];
  const migrated = migrateCourseTaskStructure(old);
  assert.deepEqual(named(migrated, 'Create module templates').dependencyIds, ['13/develop-module-2', '14/review-module-3']);
  assert.equal(resolveCourseTaskReference(migrated, '13/develop-module-2')!.name, 'Develop Module 2 content');
  assert.deepEqual(resolveCourseTaskReference(migrated, '14/review-module-3')!.predecessorIds, ['13/develop-module-3']);
  assert.equal(courseTaskNavigationId(migrated, '16'), '13');
  assert.equal(courseTaskNavigationId(migrated, '23'), '14');
  assert.equal(courseTaskNavigationId(migrated, '14/review-module-3'), '14');
  // Walk all active dependency edges and detect both dangling and cyclic links.
  const visit = (ref: string | number, stack: string[] = []) => {
    assert(!stack.includes(String(ref)), `Cycle at ${ref}`);
    const target = resolveCourseTaskReference(migrated, ref);
    assert(target, `Missing milestone ${ref}`);
    for (const dependency of [...(target.dependencyIds || []), ...(target.predecessorIds || [])]) visit(dependency, [...stack, String(ref)]);
  };
  // The synthetic templates -> module 2 edge deliberately models an external
  // consumer, not a scheduling input to module 1, so it creates no cycle.
  for (const task of migrated) {
    for (const ref of [...(task.dependencyIds || []), ...(task.predecessorIds || [])]) visit(ref);
    for (const child of task.subtasks || []) for (const ref of child.dependencyIds || []) visit(ref);
  }
});


const course = (tasks: Task[]): CourseDevelopment => ({
  id: 'module-test', courseNumber: 'TEST1234', courseTitle: 'Module workflow', tasks,
  program: 'Test', canvasVersion: '', workshopCourse: '', devType: 'Original', versionNumber: 1,
  termRelease: 'Fall A', termDeadline: '2027-08-23', devStagger: 0, onboarding: true,
  hideCompletedTasks: false, alertStatus: 'No Concerns',
  deptTeam: { smeName: 'SME', smeEmail: 'sme@example.com', deanName: '', deanEmail: '' },
  celTeam: { golf: '', chrystal: '', admin: '' },
});
test('rendered cards retain multimedia email/QB controls, dated labels, notes, and independent checkboxes', () => {
  const tasks = migrateCourseTaskStructure(legacy());
  const html = renderToStaticMarkup(React.createElement(Category1CourseDev, {
    courseDevelopments: [course(tasks)], customBlocked: [],
    onAddCourse: async () => {}, onUpdateCourse: async () => {}, onDeleteCourse: async () => {},
  }));
  const card = (id: number) => html.match(new RegExp(`<article data-task-id="${id}"[\\s\\S]*?<\\/article>`))![0];
  assert.equal((card(13).match(/type="checkbox"/g) || []).length, 4);
  assert.equal((card(14).match(/type="checkbox"/g) || []).length, 8);
  for (const id of [15, 24]) {
    assert(card(id).includes('SME to Review Email'));
    assert(card(id).includes('Multimedia Request'));
    assert(card(id).includes('multimedia content: Start '));
    assert(!/multimedia content: Start [^<]*Due/.test(card(id)));
  }
  assert(card(13).includes('Module 2 notes'));
  assert(card(14).includes('QB 3 instructions'));
  assert(html.includes('Schedule midpoint review meeting for the week of '));
  assert(!html.includes('<article data-task-id="16"'));
  assert(!html.includes('<article data-task-id="23"'));
  for (const moduleRange of ['1–4', '5–7']) {
    const dialog = renderToStaticMarkup(React.createElement(SmeReviewEmailDialog, { course: course(tasks), moduleRange, onClose: () => {} }));
    assert(dialog.includes(`for Modules ${moduleRange}`));
    assert(dialog.includes('Copy Email'));
    assert(dialog.includes('1. All content has been reviewed and confirmed as accurate.'));
  }
});


test('extra saved children and multimedia notes survive migration and recalculation', () => {
  const old = legacy();
  named(old, 'Develop Module 2 content').subtasks = [{ id: 'custom', title: 'Check SME attachments', complete: true, details: 'Keep this instruction' }];
  named(old, 'Review & Build Module 3 content').subtasks!.push({ id: 'custom', title: 'Review accessibility', complete: false, details: 'Keep this review' });
  named(old, 'Develop Module 1–3 Multimedia Content').subtasks!.push({ id: 'custom', title: 'Verify media captions', complete: true, details: 'Caption notes' });
  const migrated = migrateCourseTaskStructure(old);
  assert.equal(named(migrated, DEVELOPMENT_GROUP).subtasks!.find((subtask) => subtask.title === 'Check SME attachments')!.complete, true);
  const merged = mergeRecalculatedTimeline(migrated, build());
  assert.equal(named(merged, REVIEW_GROUP).subtasks!.find((subtask) => subtask.title === 'Review accessibility')!.details, 'Keep this review');
  assert.equal(named(merged, MULTIMEDIA_EARLY).subtasks!.find((subtask) => subtask.title === 'Verify media captions')!.complete, true);
});

function assertLateSchedule(tasks: Task[], blocked: string[] = []) {
  const dev = named(tasks, DEVELOPMENT_LATE);
  const review = named(tasks, REVIEW_LATE);
  const multimedia = named(tasks, MULTIMEDIA_LATE);
  assert.equal(dev.subtasks!.length, 3);
  assert.equal(review.subtasks!.length, 6);
  for (let index = 0; index < 3; index++) {
    const module = index + 5;
    const development = dev.subtasks![index];
    const build = review.subtasks![index * 2];
    const qb = review.subtasks![index * 2 + 1];
    assert.equal(development.title, `Develop Module ${module} content`);
    assert.equal(build.title, `Review & Build Module ${module} content`);
    assert.equal(qb.title, `Enter Module ${module} multimedia task in Quickbase`);
    assert.equal(countWorkingDaysBetween(development.startDate!, development.dueDate!, blocked), 5);
    assert.equal(countWorkingDaysBetween(build.startDate!, build.dueDate!, blocked), 1);
    if (index) assert.equal(development.startDate, dev.subtasks![index - 1].dueDate);
    assert.equal(build.startDate, development.dueDate);
    assert.equal(qb.startDate, build.dueDate);
    assert.equal(qb.dueDate, build.dueDate);
    assert.equal(qb.durationDays, 0);
    assert.equal(multimedia.subtasks![index].startDate, qb.startDate);
    assert.equal(moduleSubtaskLabel(multimedia.subtasks![index]).includes('Due'), false);
  }
  assert.equal(dev.startDate, dev.subtasks![0].startDate);
  assert.equal(dev.dueDate, dev.subtasks![2].dueDate);
  assert.equal(dev.durationDays, 15);
  assert.equal(review.startDate, review.subtasks![0].startDate);
  assert.equal(review.dueDate, review.subtasks![5].dueDate);
  assert.equal(review.durationDays, 3);
  assert(countWorkingDaysBetween(review.startDate!, review.dueDate!, blocked) > 3);
  assert.equal(multimedia.startDate, multimedia.subtasks![0].startDate);
  assert.equal(multimedia.dueDate, named(tasks, 'Conduct final review').dueDate);
}

test('Modules 5–7 use the shared inclusive schedule, stable IDs, sequential numbers, and matching card order', () => {
  for (const onboarding of [true, false]) {
    const tasks = buildCourseDevelopmentTimeline('2027-05-03', onboarding);
    assertLateSchedule(tasks);
    const dev = named(tasks, DEVELOPMENT_LATE);
    const review = named(tasks, REVIEW_LATE);
    const media = named(tasks, MULTIMEDIA_LATE);
    assert.deepEqual([dev.id, review.id, media.id], [25, 26, 24]);
    assert.deepEqual([dev.taskNumber, review.taskNumber, media.taskNumber], [17, 18, 19]);
    assert.deepEqual([dev.assignedTo, review.assignedTo, media.assignedTo], ['Subject Matter Expert', 'Instructional Designer', 'Multimedia']);
    assert.deepEqual(tasks.slice(tasks.indexOf(dev), tasks.indexOf(dev) + 3).map((task) => task.name), [DEVELOPMENT_LATE, REVIEW_LATE, MULTIMEDIA_LATE]);
    assert(!tasks.some((task) => /^Develop Module [5-7] content$|^Review & Build Module [5-7] content$/.test(task.name)));
    assert.equal(tasks.filter((task) => [DEVELOPMENT_LATE, REVIEW_LATE].includes(task.name)).reduce((sum, task) => sum + task.durationDays!, 0), 18);
  }
});

test('Modules 5–7 migration archives full standalone records and preserves notes, status, owners, QB data, and descriptions', () => {
  const old = legacy();
  named(old, 'Develop Module 6 content').status = 'Complete';
  named(old, 'Develop Module 6 content').completionDate = '2027-01-21';
  named(old, 'Develop Module 7 content').status = 'On Hold';
  named(old, 'Develop Module 5 content').notes = 'Saved development notes';
  named(old, 'Review & Build Module 6 content').assignedTo = 'Operations';
  named(old, 'Review & Build Module 6 content').subtasks![0].complete = true;
  named(old, 'Review & Build Module 6 content').subtasks![0].details = 'Saved Quickbase instructions';
  const media = named(old, 'Develop Module 4–7 Multimedia Content');
  media.status = 'On Hold';
  media.subtasks!.find((subtask) => subtask.title === 'Develop Module 7 multimedia content')!.details = 'Existing animation description';
  const before = JSON.stringify(old);
  const migrated = migrateCourseTaskStructure(old);
  assertLateSchedule(migrated);
  const dev = named(migrated, DEVELOPMENT_LATE);
  const review = named(migrated, REVIEW_LATE);
  for (let index = 0; index < 3; index++) {
    assert.deepEqual(dev.subtasks![index].sourceTask, named(old, `Develop Module ${index + 5} content`));
    assert.deepEqual(review.subtasks![index * 2].sourceTask, named(old, `Review & Build Module ${index + 5} content`));
  }
  assert.equal(dev.subtasks![1].complete, true);
  assert.equal(dev.subtasks![0].details, 'Saved development notes');
  assert.equal(review.subtasks![3].complete, true);
  assert.equal(review.subtasks![3].details, 'Saved Quickbase instructions');
  assert.equal(named(migrated, MULTIMEDIA_LATE).status, 'On Hold');
  assert.equal(named(migrated, MULTIMEDIA_LATE).notes, media.notes);
  assert.equal(named(migrated, MULTIMEDIA_LATE).subtasks![2].details, 'Existing animation description');
  assert.equal(dev.startDate, named(old, 'Develop Module 5 content').startDate);
  assert.equal(JSON.stringify(old), before);
  assert.deepEqual(migrateCourseTaskStructure(JSON.parse(JSON.stringify(migrated))), migrated);
});

test('late module dates cross weekends, holidays, and month boundaries without altering Modules 1–4', () => {
  for (const start of ['2026-10-29', '2026-11-24', '2026-12-18']) {
    const blocked = ['2026-11-02', '2026-12-21'];
    const tasks = build(blocked);
    const early = tasks.filter((task) => [DEVELOPMENT_GROUP, REVIEW_GROUP, MULTIMEDIA_EARLY].includes(task.name));
    named(tasks, DEVELOPMENT_LATE).startDate = start;
    const shifted = migrateCourseTaskStructure(tasks, blocked);
    assertLateSchedule(shifted, blocked);
    assert.deepEqual(shifted.filter((task) => [DEVELOPMENT_GROUP, REVIEW_GROUP, MULTIMEDIA_EARLY].includes(task.name)), early);
    assert.equal(named(shifted, DEVELOPMENT_LATE).subtasks![0].dueDate, stepWorkingDays(start, 4, 1, blocked));
  }
});

test('Status QB includes nine independent late entries and reflects saved checkbox changes without duplicate parents', () => {
  const tasks = build();
  const dev = named(tasks, DEVELOPMENT_LATE);
  dev.subtasks![1].complete = true;
  const review = named(tasks, REVIEW_LATE);
  review.subtasks![2].complete = true;
  review.subtasks![3].complete = true;
  const saved = migrateCourseTaskStructure(JSON.parse(JSON.stringify(tasks)));
  const entries = expandModuleReportTasks(saved).filter((task) => /^(Develop|Review & Build|Enter) Module [5-7] (content|multimedia task)/.test(task.name));
  assert.equal(entries.length, 9);
  assert(!expandModuleReportTasks(saved).some((task) => [DEVELOPMENT_LATE, REVIEW_LATE].includes(task.name)));
  for (const entry of entries) {
    const text = formatModuleStatusEntry(entry);
    assert(text.includes('Parent: '));
    assert(text.includes('start ') && text.includes('due '));
    assert(text.includes(entry.status));
  }
  assert.equal(entries.find((task) => task.name === 'Develop Module 6 content')!.status, 'Complete');
  assert.equal(entries.find((task) => task.name === 'Review & Build Module 6 content')!.status, 'Complete');
  assert.equal(entries.find((task) => task.name === 'Enter Module 6 multimedia task in Quickbase')!.status, 'Complete');
  named(saved, DEVELOPMENT_LATE).subtasks![1].complete = false;
  assert.equal(expandModuleReportTasks(saved).find((task) => task.name === 'Develop Module 6 content')!.status, 'Not Started');
});

test('late descriptions and completion persist through recalculation while final review keeps its original formula', () => {
  const old = build();
  named(old, DEVELOPMENT_LATE).subtasks![1].complete = true;
  named(old, REVIEW_LATE).subtasks![3].details = 'Edited QB notes';
  named(old, MULTIMEDIA_LATE).subtasks![2].details = 'Edited Module 7 animation';
  named(old, MULTIMEDIA_LATE).subtasks![2].complete = true;
  named(old, 'Complete Course Design Plan').startDate = '2027-02-10';
  named(old, 'Complete Course Design Plan').dueDate = '2027-02-10';
  const generated = buildCourseDevelopmentTimeline('2027-07-30', true, ['2027-03-01'], old);
  const merged = mergeRecalculatedTimeline(old, generated, ['2027-03-01']);
  assertLateSchedule(merged, ['2027-03-01']);
  assert.notEqual(named(merged, DEVELOPMENT_LATE).startDate, named(old, DEVELOPMENT_LATE).startDate);
  assert.equal(named(merged, DEVELOPMENT_LATE).subtasks![1].complete, true);
  assert.equal(named(merged, REVIEW_LATE).subtasks![3].details, 'Edited QB notes');
  assert.equal(named(merged, MULTIMEDIA_LATE).subtasks![2].details, 'Edited Module 7 animation');
  assert.equal(named(merged, MULTIMEDIA_LATE).subtasks![2].complete, true);
  assert.equal(named(merged, 'Conduct final review').dueDate, named(generated, 'Conduct final review').dueDate);
});

test('late dependencies target the correct module milestone and legacy links navigate to the new parent', () => {
  const old = legacy();
  named(old, 'Finalize course documents').predecessorIds = [30];
  named(old, 'Conduct final review').dependencyIds = [27];
  const tasks = migrateCourseTaskStructure(old);
  assert.deepEqual(named(tasks, 'Finalize course documents').predecessorIds, ['26/review-module-7']);
  assert.deepEqual(named(tasks, 'Conduct final review').dependencyIds, ['25/develop-module-6']);
  assert.equal(resolveCourseTaskReference(tasks, '26/review-module-7')!.name, 'Review & Build Module 7 content');
  assert.equal(courseTaskNavigationId(tasks, '27'), '25');
  assert.equal(courseTaskNavigationId(tasks, '30'), '26');
  for (const parent of tasks) for (const child of parent.subtasks || []) {
    for (const ref of [...(child.dependencyIds || []), ...(child.predecessorIds || [])]) assert(resolveCourseTaskReference(tasks, ref));
  }
});

test('late cards reuse dated checkbox, description, notes, duration, and multimedia pop-up controls', () => {
  const tasks = build();
  named(tasks, MULTIMEDIA_LATE).subtasks![2].details = 'Persisted multimedia title';
  const html = renderToStaticMarkup(React.createElement(Category1CourseDev, {
    courseDevelopments: [course(tasks)], customBlocked: [],
    onAddCourse: async () => {}, onUpdateCourse: async () => {}, onDeleteCourse: async () => {},
  }));
  const card = (id: number) => html.match(new RegExp(`<article data-task-id="${id}"[\\s\\S]*?<\\/article>`))![0];
  assert.equal((card(25).match(/type="checkbox"/g) || []).length, 3);
  assert.equal((card(26).match(/type="checkbox"/g) || []).length, 6);
  assert.equal((card(24).match(/type="checkbox"/g) || []).length, 3);
  assert.equal((card(24).match(/placeholder="Enter title or details"/g) || []).length, 3);
  assert(card(24).includes('Persisted multimedia title'));
  assert(card(24).includes('SME to Review Email'));
  assert(card(24).includes('Multimedia Request'));
  assert(!/multimedia content: Start [^<]*Due/.test(card(24)));
  assert(card(25).includes('15 workdays'));
  assert(card(26).includes('3 workdays'));
  assert(!html.includes('<article data-task-id="27"'));
  assert(!html.includes('<article data-task-id="30"'));
});
