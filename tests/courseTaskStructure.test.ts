import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CourseDevelopment, CourseDevelopmentTask } from '../src/types';
import { buildCourseDevelopmentTimeline, mergeRecalculatedTimeline, Category1CourseDev } from '../src/components/Category1_CourseDev';
import { getKickoffSchedulingWeek, KICKOFF_SCHEDULING_ID, getProofreadingRequest, migrateCourseTaskStructure } from '../src/utils/courseTaskStructure';
import { calculateTimelineTasks } from '../src/utils/calendarEngine';

const template = () => buildCourseDevelopmentTimeline('2027-05-03', true);
const findParent = (tasks: CourseDevelopmentTask[]) => tasks.find((task) => task.name === 'Complete proofreading')!;
const legacy = (status: CourseDevelopmentTask['status'] = 'Complete') => {
  const tasks = template();
  const request = {
    ...getProofreadingRequest(tasks)!, status,
    notes: 'Preserve these proofreading instructions.',
    startDate: '2026-10-01', dueDate: '2026-10-02', completionDate: '2026-10-03',
    manualDueDate: '2026-10-02', dependencyIds: [31],
    quickBaseCopyText: 'Existing request content',
    customMetadata: { reference: 'existing-request' },
  };
  const original = tasks.map((task) => {
    const { taskNumber, ...rest } = task;
    return task.name === 'Complete proofreading' ? { ...rest, subtasks: [], status: 'Complete' as const } : rest;
  });
  original.splice(original.findIndex((task) => task.name === 'Complete proofreading'), 0, request);
  return { tasks: original, request };
};

test('new developments have 37 sequential main tasks and one unnumbered request subtask', () => {
  for (const onboarding of [true, false]) {
    const tasks = buildCourseDevelopmentTimeline('2027-05-03', onboarding);
    assert.equal(tasks.length, 37);
    assert.deepEqual(tasks.map((task) => task.taskNumber), Array.from({ length: 37 }, (_, index) => index + 1));
    assert.equal(findParent(tasks).taskNumber, 31);
    assert.equal(tasks.at(-1)!.taskNumber, 37);
    assert(!tasks.some((task) => task.name === 'Submit proofreading request'));
    assert.equal(findParent(tasks).subtasks!.filter((task) => task.title === 'Submit proofreading request').length, 1);
    assert.equal(findParent(tasks).subtasks![0].complete, false);
    assert.equal(getProofreadingRequest(tasks)!.id, 32);
  }
});

test('saved task migration preserves every original request field and all other records without mutation', () => {
  for (const status of ['Complete', 'In Progress', 'Not Applicable'] as const) {
    const { tasks, request } = legacy(status);
    const before = JSON.stringify(tasks);
    const migrated = migrateCourseTaskStructure(tasks);
    const moved = findParent(migrated).subtasks![0];
    assert.equal(moved.title, 'Submit proofreading request');
    assert.equal(moved.complete, status === 'Complete');
    assert.equal(moved.details, request.notes);
    assert.deepEqual(moved.sourceTask, request);
    assert.equal(findParent(migrated).status, 'Complete');
    assert.equal(findParent(migrated).id, 33);
    assert.equal(findParent(migrated).taskNumber, 31);
    assert.equal(JSON.stringify(tasks), before);
    assert.deepEqual(migrated.map((task) => task.name), tasks.filter((task) => task !== request).map((task) => task.name));
    for (const task of migrated.filter((task) => task.name !== 'Complete proofreading')) {
      const { taskNumber, ...rest } = task;
      assert.deepEqual(rest, tasks.find((original) => original.id === task.id));
    }
    assert.deepEqual(migrateCourseTaskStructure(migrated), migrated);
    assert.deepEqual(migrateCourseTaskStructure(JSON.parse(JSON.stringify(migrated))), migrated);
  }
});

test('recalculation and save/reload retain edited subtask progress, notes, historical dates, and custom metadata', () => {
  const { tasks, request } = legacy();
  const migrated = migrateCourseTaskStructure(tasks);
  findParent(migrated).subtasks![0].complete = false;
  findParent(migrated).subtasks![0].details = 'Edited request notes';
  findParent(migrated).subtasks!.push({ id: 'custom', title: 'Existing custom subtask', complete: true, details: 'Keep me' });
  const merged = mergeRecalculatedTimeline(JSON.parse(JSON.stringify(migrated)), template());
  assert.equal(merged.length, 37);
  assert.deepEqual(findParent(merged).subtasks, findParent(migrated).subtasks);
  assert.deepEqual(getProofreadingRequest(merged), request);
  assert.equal(findParent(merged).status, 'Complete');
  assert.equal(findParent(merged).completionDate, findParent(migrated).completionDate);
  assert.deepEqual(merged.map((task) => task.taskNumber), migrated.map((task) => task.taskNumber));
});

test('legacy annotated names migrate and a missing parent does not discard the request', () => {
  const { tasks } = legacy();
  const annotated = tasks.map((task) => task.name === 'Submit proofreading request' ? { ...task, name: task.name + ' [Quickbase]' }
    : task.name === 'Complete proofreading' ? { ...task, name: task.name + ' [Quality Assurance]' } : task);
  const migrated = migrateCourseTaskStructure(annotated);
  assert.equal(migrated.length, 37);
  assert.equal(getProofreadingRequest(migrated)!.dueDate, '2026-10-02');
  const noParent = tasks.filter((task) => task.name !== 'Complete proofreading');
  assert.deepEqual(getProofreadingRequest(migrateCourseTaskStructure(noParent)), getProofreadingRequest(noParent));
  const generated = calculateTimelineTasks('2027-08-23', true);
  assert(!generated.some((task) => task.name.startsWith('Submit proofreading request')));
  assert(getProofreadingRequest(generated));
  assert.deepEqual(generated.map((task) => task.taskNumber), Array.from({ length: generated.length }, (_, index) => index + 1));
});

test('parent renders the only proofreading pop-out button and exposes the incomplete subtask under a completed parent', () => {
  const tasks = migrateCourseTaskStructure(legacy('In Progress').tasks);
  const course: CourseDevelopment = {
    id: 'test-course', courseNumber: 'HUS4722', courseTitle: 'Test course',
    tasks, onboarding: true, hideCompletedTasks: true,
    program: 'Test program', canvasVersion: '', workshopCourse: '', devType: 'Original',
    versionNumber: 1, termRelease: 'Fall A', termDeadline: '2027-08-23',
    devStagger: 0, alertStatus: 'No Concerns',
    deptTeam: { smeName: '', smeEmail: '', deanName: '', deanEmail: '' },
    celTeam: { golf: '', chrystal: '', admin: '' },
  };
  const html = renderToStaticMarkup(React.createElement(Category1CourseDev, {
    courseDevelopments: [course], customBlocked: [],
    onAddCourse: async () => {}, onUpdateCourse: async () => {}, onDeleteCourse: async () => {},
  }));
  const parent = html.match(/<article data-task-id="33"[\s\S]*?<\/article>/)![0];
  assert(parent.includes('aria-label="Task 31"'));
  assert(parent.includes('Submit proofreading request notes'));
  assert(parent.includes('Preserve these proofreading instructions.'));
  assert.equal((parent.match(/Submit Proofreading Request<\/button>/g) || []).length, 1);
  assert.equal((html.match(/Submit Proofreading Request<\/button>/g) || []).length, 1);
  assert(!html.includes('<article data-task-id="32"'));
  const initial = html.match(/<article data-task-id="6"[\s\S]*?<\/article>/)![0];
  assert.equal((initial.match(/type="checkbox"/g) || []).length, 4);
  for (const label of ['Initial Meeting Recap', 'Send Course Design Plan Draft', 'Schedule kickoff meeting']) {
    assert(initial.includes(label + '</button>'));
  }
  assert(initial.includes('Schedule kickoff meeting for the week of ' + getKickoffSchedulingWeek(tasks)));
  assert(initial.includes('1 day'));
  assert(!html.includes('<article data-task-id="8"'));
  assert.equal((html.match(/aria-label="Schedule kickoff meeting"/g) || []).length, 1);
});


test('kickoff consolidation preserves legacy records, independent completion, and changing dates', () => {
  const tasks = template();
  const parent = tasks.find((task) => task.id === 6)!;
  parent.notes = 'Initial meeting notes';
  parent.status = 'Complete';
  parent.subtasks = parent.subtasks!.filter((subtask) => subtask.id !== KICKOFF_SCHEDULING_ID);
  const request: CourseDevelopmentTask = {
    id: 8, name: 'Schedule kickoff meeting', phase: 'Project Management',
    assignedTo: 'Instructional Designer', status: 'Complete', durationDays: 0,
    notes: 'Custom kickoff notes', startDate: '2026-12-01', dueDate: '2026-12-02',
    completionDate: '2026-12-03', dependencyIds: [9],
  };
  tasks.splice(7, 0, request);
  const before = JSON.stringify(tasks);
  const migrated = migrateCourseTaskStructure(tasks);
  const initial = migrated.find((task) => task.id === 6)!;
  const moved = initial.subtasks![3];
  assert.equal(initial.subtasks!.length, 4);
  assert.deepEqual(initial.subtasks!.slice(0, 3).map((subtask) => subtask.title),
    ['Send Initial Meeting Recap', 'Draft Course Design Plan', 'Send Course Design Plan draft to SME']);
  assert.equal(moved.title, `Schedule kickoff meeting for the week of ${getKickoffSchedulingWeek(migrated)}`);
  assert.equal(moved.complete, true);
  assert.deepEqual(moved.sourceTask, request);
  assert.equal(moved.details, request.notes);
  assert.equal(initial.notes, parent.notes);
  assert.equal(initial.status, parent.status);
  assert.equal(initial.durationDays, 1);
  assert.equal(initial.durationLabel, '1 day');
  assert.equal(migrated.find((task) => task.id === 9)!.taskNumber, 8);
  assert(!migrated.some((task) => task.id === 8));
  assert.equal(JSON.stringify(tasks), before);
  moved.complete = false;
  const saved = JSON.parse(JSON.stringify(migrated));
  saved.find((task: CourseDevelopmentTask) => task.id === 11).startDate = '2027-02-16';
  const updated = migrateCourseTaskStructure(saved);
  assert.equal(updated.find((task) => task.id === 6)!.subtasks![3].title, 'Schedule kickoff meeting for the week of 02/16/27');
  const merged = mergeRecalculatedTimeline(updated, template());
  const result = merged.find((task) => task.id === 6)!;
  assert.equal(result.subtasks![3].complete, false);
  assert.deepEqual(result.subtasks![3].sourceTask, request);
  assert.equal(result.status, 'Complete');
  assert.equal(result.subtasks![0].complete, false);
  assert.deepEqual(migrateCourseTaskStructure(updated), updated);
});


test('kickoff week follows existing working-day dependencies and changes with the plan', () => {
  const original = template();
  const revisedPlan = original.map((task) => task.id === 9 ? { ...task, startDate: '2027-02-01', dueDate: '2027-02-01' } : task);
  const changed = buildCourseDevelopmentTimeline('2027-05-03', true, ['2027-02-02'], revisedPlan);
  assert.notEqual(getKickoffSchedulingWeek(changed), getKickoffSchedulingWeek(original));
  assert.equal(changed.find((task) => task.id === 6)!.subtasks![3].title,
    `Schedule kickoff meeting for the week of ${getKickoffSchedulingWeek(changed)}`);
  assert(!changed.some((task) => task.name === 'Schedule kickoff meeting'));
  assert.equal(changed.filter((task) => task.id === 6).reduce((total, task) => total + (task.durationDays || 0), 0), 1);
  const generic = calculateTimelineTasks('2027-08-23', true);
  assert(!generic.some((task) => task.name.startsWith('Schedule kickoff meeting')));
  assert.equal(generic.find((task) => task.name.startsWith('Conduct initial meeting'))!.subtasks![3].id, KICKOFF_SCHEDULING_ID);
});
