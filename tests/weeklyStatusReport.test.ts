import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeeklyStatusReport } from '../src/utils/weeklyStatusReport';
import type { CourseDevelopment, CourseDevelopmentTask as Task } from '../src/types';
const task = (id: string, name: string, overrides: Partial<Task> = {}): Task => ({ id, name, phase: '', assignedTo: 'SME', status: 'Not Started', dueDate: '2026-10-28', ...overrides });
const course = (tasks: Task[] = []): CourseDevelopment => ({ tasks, onboarding: false, alertStatus: 'No Concerns' } as CourseDevelopment);
const report = (c: CourseDevelopment, progress = 0) => generateWeeklyStatusReport(c, progress, [], undefined, '2026-10-26');
test('new project stays at zero; omits empty sections, far future work and onboarding', () => {
  const output = report(course([task('1', 'Future inventory', { dueDate: '2027-04-01' })]));
  assert.match(output, /0% complete/); assert.match(output, /Alerts\nNo Concerns/);
  for (const text of ['Completed This Week', 'Notes\n', 'Onboarding', 'Future inventory', 'Not Started', 'Parent:']) assert(!output.includes(text));
});
test('active children retain ownership and overrides without duplicating parents or future siblings', () => {
  const c = course([task('p', 'Parent summary', { status: 'In Progress', subtasks: [
    { id: 'a', title: 'SME development', complete: false, details: '', assignedTo: 'SME', status: 'Developing (Content)', dueDate: '2026-10-29' },
    { id: 'b', title: 'ID review', complete: false, details: '', assignedTo: 'ID', dueDate: '2026-12-01', manualDueDate: '2026-10-30' },
    { id: 'c', title: 'Later work', complete: false, details: '', dueDate: '2027-02-01' },
  ] })]);
  const before = JSON.stringify(c), output = report(c, 23);
  assert.match(output, /23% complete/); assert.match(output, /Subject Matter Expert:\n- SME development — Due 10\/29\/26/);
  assert.match(output, /Instructional Designer:\n- ID review — Due 10\/30\/26/);
  assert(!output.includes('Parent')); assert(!output.includes('Later work')); assert.equal(JSON.stringify(c), before);
});
test('completion uses actual dates within previous seven calendar days, never projected dates', () => {
  const output = report(course([
    task('1', 'Recent complete', { status: 'Complete', completionDate: '2026-10-19' }),
    task('2', 'Old complete', { status: 'Complete', completionDate: '2026-10-18' }),
    task('3', 'Undated complete', { status: 'Complete' }),
    task('4', 'Parent', { subtasks: [{ id: 'a', title: 'Completed child', complete: true, details: '', completionDate: '2026-10-25' }] }),
  ]));
  assert.match(output, /Recent complete — Completed 10\/19\/26/); assert.match(output, /Completed child — Completed 10\/25\/26/);
  assert(!output.includes('Old complete')); assert(!output.includes('Undated complete'));
});
test('final review and onboarding appear once, concerns and notes survive, overdue work stays visible', () => {
  const c = course([task('f', 'Conduct final review'), task('o', 'Conduct onboarding meeting'), task('late', 'Late SME work', { dueDate: '2026-10-01' }), task('blocked', 'Blocked work', {status: 'Blocked', dueDate: '2027-01-01'})]);
  c.onboarding = true; c.alertStatus = 'High Priority Concerns'; c.courseNotes = 'Waiting for approval.';
  const output = report(c);
  assert.equal(output.split('Final Review').length - 1, 1); assert.match(output, /Onboarding/);
  assert.match(output, /Late SME work — Due 10\/01\/26 — Overdue/); assert.match(output, /Blocked work.*Blocked/);
  assert.match(output, /High Priority Concerns/); assert.match(output, /Notes\nWaiting for approval/);
});
test('upcoming window uses ten FSCJ workdays and respects custom closures', () => {
  const c = course([task('1', 'Boundary', {dueDate: '2026-11-10'})]);
  assert(!report(c).includes('Boundary'));
  assert(generateWeeklyStatusReport(c, 0, ['2026-10-27'], undefined, '2026-10-26').includes('Boundary'));
});

test('Status QB popup and clipboard contain identical plain text with preserved email fields', async () => {
  const { JSDOM } = await import('jsdom');
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { Category1CourseDev } = await import('../src/components/Category1_CourseDev');
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
  const keys = ['window', 'document', 'navigator', 'localStorage', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  let copied = '', popupHTML = '';
  Object.defineProperty(globalThis, 'window', { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: async (text: string) => { copied = text; } } } });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  dom.window.open = (() => ({ document: { write: (text: string) => { popupHTML = text; }, close: () => {} } })) as any;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: dom.window.localStorage });
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    const c = { ...course(), id: 'test', courseNumber: 'TEST1234', courseTitle: 'Test & Course', termRelease: 'Fall A',
      termDeadline: '2027-08-01', devType: 'Modification', versionNumber: 1, celTeam: { golf: '', chrystal: '', admin: '' },
      deptTeam: { smeEmail: 'sme@example.com', deanEmail: 'dean@example.com', managerEmail: 'manager@example.com', associateDeanEmail: 'associate@example.com' } } as CourseDevelopment;
    await React.act(async () => root.render(React.createElement(Category1CourseDev, {
      courseDevelopments: [c], customBlocked: [], onAddCourse: async () => {}, onUpdateCourse: async () => {}, onDeleteCourse: async () => {},
    })));
    const button = [...dom.window.document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Status QB');
    assert(button);
    await React.act(async () => button.click());
    assert(copied.startsWith('TO: sme@example.com\nCC: dean@example.com,manager@example.com,associate@example.com\nSUBJECT: TEST1234 Course Development Status '));
    assert(copied.includes('This is a friendly update on the status of the course development. You do not need to take any action or respond to this email. It is for your information only.'));
    assert.equal(new JSDOM(popupHTML).window.document.querySelector('textarea')?.value, copied);
    assert(!copied.includes('Parent:')); assert(!copied.includes('<html>'));
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  }
});
