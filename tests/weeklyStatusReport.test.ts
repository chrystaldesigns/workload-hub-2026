import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeeklyStatusReport } from '../src/utils/weeklyStatusReport';
import type { CourseDevelopment, CourseDevelopmentTask as Task } from '../src/types';
const task = (id: string, name: string, overrides: Partial<Task> = {}): Task => ({ id, name, phase: '', assignedTo: 'SME', status: 'Not Started', dueDate: '2026-10-28', ...overrides });
const course = (tasks: Task[] = []): CourseDevelopment => ({ tasks, onboarding: false, alertStatus: 'No Concerns' } as CourseDevelopment);
const report = (c: CourseDevelopment, progress = 0) => generateWeeklyStatusReport(c, progress, [], new Date('2026-10-26T12:00:00'));
const required = ['SUBJECT MATTER EXPERT:', 'INSTRUCTIONAL DESIGNER:', 'MULTIMEDIA:', 'CEL QUALITY ASSURANCE:', 'Overall Progress: Course design and development is', 'NOTES:', 'ALERTS:', 'MILESTONES & OFF-TIME', 'SME DELIVERABLES COMPLETE:', 'DEVELOPMENT COMPLETION:'];
const forbidden = ['Currently In Progress', 'Upcoming Activities', 'Completed This Week', 'Key Milestones', '(Parent:'];
function verifyFormat(output: string) {
  for (const label of required) assert(output.includes(label), label);
  for (const label of forbidden) assert(!output.includes(label), label);
}
test('restores original headings including empty roles, notes, alerts and all eight milestones', () => {
  const output = report(course()); verifyFormat(output);
  for (const label of ['ONBOARDING:', 'INITIAL MEETING:', 'COURSE DESIGN PLAN:', 'KICKOFF:', 'MIDPOINT REVIEW:', 'FINAL REVIEW:']) assert(output.includes(label));
  assert(output.includes('NOTES: None at this time.')); assert(output.includes('ALERTS: No Concerns'));
  assert(output.startsWith('Overall Progress: Course design and development is 0% complete.'));
});
test('historical task selection includes all future work, excludes completed and N/A, and groups by responsibility', () => {
  const c = course([task('future', 'Distant SME task', { dueDate: '2028-04-01' }), task('done', 'Done task', {status:'Complete'}), task('na','Not applicable task',{status:'Not Applicable'}), task('id','ID task',{assignedTo:'Instructional Designer',status:'Blocked'}), task('mm','Media task',{assignedTo:'Multimedia'}), task('qa','Proofreading task',{assignedTo:'Quality Assurance'})]);
  const before = JSON.stringify(c), output = report(c, 34); verifyFormat(output);
  assert(output.includes('34% complete.')); assert(output.includes('Distant SME task — Not Started (due 04/01/28)'));
  assert(!output.includes('Done task')); assert(!output.includes('Not applicable task'));
  assert(output.includes('INSTRUCTIONAL DESIGNER:\n- ID task — Blocked'));
  assert(output.includes('MULTIMEDIA:\n- Media task'));
  assert(output.includes('CEL QUALITY ASSURANCE:\n- Proofreading task'));
  assert.equal(JSON.stringify(c), before);
});
test('original module expansion retains dates, statuses and owners while omitting parent annotations', () => {
  const output = report(course([task('p','Develop Modules 1–4 content',{subtasks:[
    {id:'develop-module-1',title:'Develop Module 1 content',complete:false,details:'',startDate:'2026-12-09',dueDate:'2026-12-15'},
    {id:'develop-module-2',title:'Develop Module 2 content',complete:true,details:''},
    {id:'quickbase-module-1',title:'Quickbase update',complete:false,details:'',assignedTo:'Instructional Designer'},
  ]})])); verifyFormat(output);
  assert(output.includes('- Develop Module 1 content — Not Started (start 12/09/26, due 12/15/26)'));
  assert(!output.includes('Develop Module 2 content')); assert(!output.includes('Develop Modules 1–4 content'));
  assert(output.includes('INSTRUCTIONAL DESIGNER:\n- Quickbase update'));
});
test('milestones preserve actual dates, statuses, meeting time, notes, concerns and future off-time', () => {
  const c = course([task('f','Conduct final review',{dueDate:'2026-12-01',status:'Scheduled',scheduledMeetingTime24:'14:30'}),task('end','End compensation',{dueDate:'2026-12-03',status:'Complete'}),task('finish','Course completion',{dueDate:'2026-12-15',status:'In Progress'})]);
  c.courseNotes='Existing note'; c.alertStatus='Potential Concerns';
  const output=generateWeeklyStatusReport(c,42,['2026-12-24','2026-01-01'],new Date('2026-10-26T12:00:00')); verifyFormat(output);
  assert(output.includes('FINAL REVIEW: 12/01/26 at 2:30 PM, Scheduled'));
  assert(output.includes('SME DELIVERABLES COMPLETE: 12/03/26, Complete'));
  assert(output.includes('DEVELOPMENT COMPLETION: 12/15/26, In Progress'));
  assert(output.includes('NOTES: Existing note')); assert(output.includes('ALERTS: Potential Concerns'));
  assert(output.includes('College Closed / Vacation / Out-of-Office Dates:\n- 12/24/26'));
  assert(!output.includes('01/01/26'));
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
  const { readFileSync, writeFileSync } = await import('node:fs');
  const live = process.env.WEEKLY_STATUS_PREVIEW_DATA ? JSON.parse(readFileSync(process.env.WEEKLY_STATUS_PREVIEW_DATA, 'utf8')) : null;
  const root = createRoot(dom.window.document.getElementById('root')!);
  try {
    const fixture = { ...course(), id: 'test', courseNumber: 'TEST1234', courseTitle: 'Test & Course', termRelease: 'Fall A',
      termDeadline: '2027-08-01', devType: 'Modification', versionNumber: 1, celTeam: { golf: '', chrystal: '', admin: '' },
      deptTeam: { smeEmail: 'sme@example.com', deanEmail: 'dean@example.com', managerEmail: 'manager@example.com', associateDeanEmail: 'associate@example.com' } } as CourseDevelopment;
    const c: CourseDevelopment = live ? live.courses.find((saved: CourseDevelopment) => saved.courseNumber === 'HSC1531') : fixture;
    assert(c);
    await React.act(async () => root.render(React.createElement(Category1CourseDev, {
      courseDevelopments: [c], customBlocked: live?.settings.customBlocked || [], onAddCourse: async () => {}, onUpdateCourse: async () => {}, onDeleteCourse: async () => {},
    })));
    const button = [...dom.window.document.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Status QB');
    assert(button);
    await React.act(async () => button.click());
    const to = [c.deptTeam.smeEmail].filter(Boolean).join('; ');
    const cc = [c.deptTeam.deanEmail, c.deptTeam.managerEmail, c.deptTeam.associateDeanEmail].filter(Boolean).join(',');
    assert(copied.startsWith(`TO: ${to}\nCC: ${cc}\nSUBJECT: ${c.courseNumber} Course Development Status `));
    assert(copied.includes('This is a friendly update on the status of the course development. You do not need to take any action or respond to this email. It is for your information only.'));
    assert.equal(new JSDOM(popupHTML).window.document.querySelector('textarea')?.value, copied);
    verifyFormat(copied);
    if (live && process.env.WEEKLY_STATUS_PREVIEW_OUTPUT) {
      writeFileSync(process.env.WEEKLY_STATUS_PREVIEW_OUTPUT, copied.split('\nBODY:\n')[1]);
    }
    assert(!copied.includes('Parent:')); assert(!copied.includes('<html>'));
  } finally {
    await React.act(async () => root.unmount()); dom.window.close();
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  }
});
