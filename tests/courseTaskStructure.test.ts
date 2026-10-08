import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CourseDevelopment, CourseDevelopmentTask } from '../src/types';
import { buildCourseDevelopmentTimeline, mergeRecalculatedTimeline, Category1CourseDev } from '../src/components/Category1_CourseDev';
import { getProofreadingRequest, migrateProofreadingTaskStructure } from '../src/utils/courseTaskStructure';
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

test('new developments have 38 sequential main tasks and one unnumbered request subtask', () => {
  for (const onboarding of [true, false]) {
    const tasks = buildCourseDevelopmentTimeline('2027-05-03', onboarding);
    assert.equal(tasks.length, 38);
    assert.deepEqual(tasks.map((task) => task.taskNumber), Array.from({ length: 38 }, (_, index) => index + 1));
    assert.equal(findParent(tasks).taskNumber, 32);
    assert.equal(tasks.at(-1)!.taskNumber, 38);
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
    const migrated = migrateProofreadingTaskStructure(tasks);
    const moved = findParent(migrated).subtasks![0];
    assert.equal(moved.title, 'Submit proofreading request');
    assert.equal(moved.complete, status === 'Complete');
    assert.equal(moved.details, request.notes);
    assert.deepEqual(moved.sourceTask, request);
    assert.equal(findParent(migrated).status, 'Complete');
    assert.equal(findParent(migrated).id, 33);
    assert.equal(findParent(migrated).taskNumber, 32);
    assert.equal(JSON.stringify(tasks), before);
    assert.deepEqual(migrated.map((task) => task.name), tasks.filter((task) => task !== request).map((task) => task.name));
    for (const task of migrated.filter((task) => task.name !== 'Complete proofreading')) {
      const { taskNumber, ...rest } = task;
      assert.deepEqual(rest, tasks.find((original) => original.id === task.id));
    }
    assert.deepEqual(migrateProofreadingTaskStructure(migrated), migrated);
    assert.deepEqual(migrateProofreadingTaskStructure(JSON.parse(JSON.stringify(migrated))), migrated);
  }
});

test('recalculation and save/reload retain edited subtask progress, notes, historical dates, and custom metadata', () => {
  const { tasks, request } = legacy();
  const migrated = migrateProofreadingTaskStructure(tasks);
  findParent(migrated).subtasks![0].complete = false;
  findParent(migrated).subtasks![0].details = 'Edited request notes';
  findParent(migrated).subtasks!.push({ id: 'custom', title: 'Existing custom subtask', complete: true, details: 'Keep me' });
  const merged = mergeRecalculatedTimeline(JSON.parse(JSON.stringify(migrated)), template());
  assert.equal(merged.length, 38);
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
  const migrated = migrateProofreadingTaskStructure(annotated);
  assert.equal(migrated.length, 38);
  assert.equal(getProofreadingRequest(migrated)!.dueDate, '2026-10-02');
  const noParent = tasks.filter((task) => task.name !== 'Complete proofreading');
  assert.equal(migrateProofreadingTaskStructure(noParent), noParent);
  const generated = calculateTimelineTasks('2027-08-23', true);
  assert(!generated.some((task) => task.name.startsWith('Submit proofreading request')));
  assert(getProofreadingRequest(generated));
  assert.deepEqual(generated.map((task) => task.taskNumber), Array.from({ length: generated.length }, (_, index) => index + 1));
});

test('parent renders the only proofreading pop-out button and exposes the incomplete subtask under a completed parent', () => {
  const tasks = migrateProofreadingTaskStructure(legacy('In Progress').tasks);
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
  assert(parent.includes('aria-label="Task 32"'));
  assert(parent.includes('Submit proofreading request notes'));
  assert(parent.includes('Preserve these proofreading instructions.'));
  assert.equal((parent.match(/Submit Proofreading Request<\/button>/g) || []).length, 1);
  assert.equal((html.match(/Submit Proofreading Request<\/button>/g) || []).length, 1);
  assert(!html.includes('<article data-task-id="32"'));
});
