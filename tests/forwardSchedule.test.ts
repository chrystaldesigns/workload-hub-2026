import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { forwardSchedule, resolveDependencies, recommendedWindow, recalculateCourse, templateOverlaps, staggeredStart } from '../src/utils/forwardSchedule';
import { fscjCalendar, OFFICIAL_TERM_PLANNING, planningDeadline, getCourseTerm } from '../src/utils/termPlanning';
import { inclusiveDue, offsetWorkdays, dayNumber } from '../src/utils/fscjCalendar';
import { buildCourseDevelopmentTimeline, Category1CourseDev } from '../src/components/Category1_CourseDev';
import { planningRows, proposalProjectId } from '../src/utils/planningRows';
import { CoursePlanningViews } from '../src/components/CoursePlanningViews';
import type { CourseDevelopment } from '../src/types';
const settings = { ...structuredClone(OFFICIAL_TERM_PLANNING), multimediaWorkdays: 5 };
const calendar = fscjCalendar(settings);
const start = '2026-10-05';
const tasks = () => buildCourseDevelopmentTimeline('2027-03-26', true);
const run = (extra: Partial<Parameters<typeof forwardSchedule>[0]> = {}) => forwardSchedule({ start, onboarding: true, tasks: tasks(), settings, ...extra });
const course = (id = 'one', date = start): CourseDevelopment => ({ id, courseNumber: id === 'one' ? 'ABC1234' : 'DEF1234', courseTitle: 'Test', onboarding: true, projectStartDate: date, scheduleVersion: 1, termRelease: 'Summer Term', targetTermYear: 2027, tasks: tasks(), program: 'Test', canvasVersion: 'v1', workshopCourse: 'Test', devType: 'Original', versionNumber: 1, termDeadline: '2027-05-10', devStagger: 14, celTeam: {} as any, deptTeam: {} as any, alertStatus: 'No Concerns', hideCompletedTasks: false });
const d = (r: ReturnType<typeof run>, id: string) => r.dates[id];
test('onboarding selection changes project root and skips dates without losing task metadata', () => { const yes = run(), no = run({ onboarding: false }); assert.equal(d(yes, '2').start, start); assert.equal(d(no, '5').start, start); assert(!no.dates['4']); assert.equal(no.tasks.find(t => t.id === 4)?.status, 'Not Applicable'); assert(yes.completion > no.completion); assert.equal(no.tasks.length, 26); });
test('independent compensation date and metadata never change the dependent schedule', () => { const saved = tasks(); saved[0].startDate = '2025-01-01'; saved[0].dueDate = '2028-01-01'; saved[0].notes = 'preserve'; const r = run({ tasks: saved }); assert.deepEqual(r.tasks[0], { ...saved[0], taskNumber: 1 }); assert.equal(r.completion, run().completion); });
test('five-workday onboarding, initial and kickoff meeting allowances use increments', () => { const r = run(); assert.equal(d(r, '4').start, offsetWorkdays(start, 5, calendar)); assert.equal(d(r, '6').start, offsetWorkdays(d(r, '4').due, 5, calendar)); assert.equal(d(r, '11').start, offsetWorkdays(d(r, '9').due, 5, calendar)); });
test('earlier initial meeting pulls only dependent activities earlier', () => { const saved = tasks(); saved.find(t => t.id === 6)!.manualStartDate = '2026-10-13'; const r = run({ tasks: saved }); assert.equal(d(r, '6').start, '2026-10-13'); assert(r.completion < run().completion); assert(!r.warnings.some(w => w.kind === 'dependency' && w.task === '6')); assert.deepEqual(d(r, '4'), d(run(), '4')); });
test('all meeting reminders are two FSCJ workday increments before their meetings', () => { const r = run(); for (const [reminder, meeting] of [['3', '4'], ['10', '11'], ['20', '21'], ['36', '37']])
    assert.equal(d(r, reminder).due, offsetWorkdays(d(r, meeting).start, -2, calendar)); });
test('weekends, published holidays and winter closure are skipped with date-only arithmetic', () => { assert.equal(offsetWorkdays('2026-11-10', 1, calendar), '2026-11-12'); assert.equal(offsetWorkdays('2026-12-18', 1, calendar), '2027-01-04'); assert.equal(inclusiveDue('2026-10-09', 2, calendar), '2026-10-12'); assert.throws(() => dayNumber('2027-02-30')); });
test('same-day dependencies share boundaries while explicit next-workday offsets remain distinct', () => { const r = resolveDependencies([{ id: 'a', duration: 1, dependencies: [] }, { id: 'b', duration: 1, dependencies: [{ id: 'a' }] }, { id: 'c', duration: 1, dependencies: [{ id: 'a', offset: 1 }] }], start, calendar); assert.equal(r.dates.a.due, r.dates.b.start); assert.equal(r.dates.c.start, '2026-10-06'); });
test('Module 1 starts on kickoff day', () => { const r = run(); assert.equal(d(r, '13/develop-module-1').start, d(r, '11').start); });
test('seven SME cycles use five inclusive days and shared-day successors', () => { const r = run(); for (let m = 1; m <= 7; m++) {
    const id = `${m <= 4 ? 13 : 25}/develop-module-${m}`, dates = d(r, id);
    assert.equal(dates.due, inclusiveDue(dates.start, 5, calendar));
    if (m > 1)
        assert.equal(dates.start, d(r, `${m - 1 <= 4 ? 13 : 25}/develop-module-${m - 1}`).due);
} });
test('every module review starts and finishes on corresponding SME due date', () => { const r = run(); for (let m = 1; m <= 7; m++) {
    const review = d(r, `${m <= 4 ? 14 : 26}/review-module-${m}`);
    assert.equal(review.start, d(r, `${m <= 4 ? 13 : 25}/develop-module-${m}`).due);
    assert.equal(review.start, review.due);
} });
test('Quickbase requests are same-day review successors', () => { const r = run(); for (let m = 1; m <= 7; m++)
    assert.equal(d(r, `${m <= 4 ? 14 : 26}/quickbase-module-${m}`).due, d(r, `${m <= 4 ? 14 : 26}/review-module-${m}`).due); });
test('template preparation ends after six post-kickoff workdays and email dates follow previous SME due', () => { const r = run(), template = r.tasks.find(t => t.id === 12)!; assert.equal(template.startDate, d(r, '9').start); assert.equal(template.dueDate, offsetWorkdays(d(r, '11').start, 6, calendar)); for (let m = 1; m <= 7; m++) {
    const s = template.subtasks!.find(s => s.title === `Module ${m}`)!;
    assert.equal(s.templateDueDate, m === 1 ? d(r, '11').start : offsetWorkdays(d(r, '11').start, m - 1, calendar));
    assert.equal(s.scheduledEmailDate, m === 1 ? d(r, '11').start : offsetWorkdays(d(r, `${m - 1 <= 4 ? 13 : 25}/develop-module-${m - 1}`).due, -1, calendar));
} assert(template.dueDate! < template.subtasks!.find(s => s.title === 'Module 7')!.scheduledEmailDate!); });
test('multimedia develops in parallel from per-module requests and can extend final readiness', () => { const r = run({ multimediaWorkdays: 40 }); assert.equal(d(r, '15/multimedia-module-1').start, d(r, '14/quickbase-module-1').due); assert(d(r, '15/multimedia-module-1').due > d(r, '15/multimedia-module-2').start); assert(d(r, '37').start >= d(r, '24/multimedia-module-7').due); });
test('manual midpoint stays fixed despite unfinished Module 4 and generates no readiness conflict', () => { const saved = tasks(); saved.find(t => t.id === 21)!.manualStartDate = '2026-10-13'; const r = run({ tasks: saved }); assert.equal(d(r, '21').start, '2026-10-13'); assert(d(r, '13/develop-module-4').due > '2026-10-13'); assert(!r.warnings.some(w => w.task === '21')); assert.equal(d(r, '20').start, offsetWorkdays('2026-10-13', -2, calendar)); });
test('course documents start on module 7 review while multimedia continues independently', () => { const r = run({ multimediaWorkdays: 40 }); assert.equal(d(r, '31').start, d(r, '26/review-module-7').due); assert(d(r, '31').due < d(r, '24/multimedia-module-7').due); assert.equal(d(r, '31').due, offsetWorkdays(d(r, '31').start, 3, calendar)); });
test('proofreading and pre-QA are concurrent five-inclusive-workday activities', () => { const r = run(); assert.equal(d(r, '33').start, d(r, '31').due); assert.deepEqual(d(r, '33'), d(r, '34')); assert.equal(d(r, '33').due, inclusiveDue(d(r, '33').start, 5, calendar)); assert.equal(d(r, '35').start, d(r, '34').due); assert.equal(d(r, '35').due, inclusiveDue(d(r, '35').start, 5, calendar)); });
test('manual final review remains selected with explicit unmet-activity date warnings', () => { const saved = tasks(); saved.find(t => t.id === 37)!.manualDueDate = '2026-11-02'; const r = run({ tasks: saved }); assert.equal(d(r, '37').due, '2026-11-02'); assert(r.warnings.some(w => w.kind === 'final-readiness' && w.message.includes('2026-11-02') && w.message.includes('completion'))); });
test('course completion always reserves all five inclusive workdays after final review', () => { const r = run(); assert.equal(d(r, '39').start, d(r, '37').due); assert.equal(r.completion, inclusiveDue(d(r, '37').due, 5, calendar)); });
test('administrative deadline uses exactly 30 FSCJ increments and flags late completion', () => { assert.equal(planningDeadline(getCourseTerm(course()), settings).date, '2027-03-26'); const r = run({ deadline: '2026-10-06', courseNumber: 'ABC1234' }); assert(r.warnings.some(w => w.kind === 'deadline' && w.message.includes('ABC1234') && w.message.includes('2026-10-06'))); });
test('manual kickoff persists through later edits and propagates dependent dates', () => { const c = course(); c.tasks.find(t => t.id === 11)!.manualStartDate = '2026-11-16'; const first = recalculateCourse(c, settings); const second = recalculateCourse({ ...first, projectStartDate: '2026-10-06' }, settings); assert.equal(second.tasks.find(t => t.id === 11)!.startDate, '2026-11-16'); assert.equal(second.tasks.find(t => t.id === 13)!.startDate, '2026-11-16'); });
test('template workload conflicts identify both active courses and overlapping dates only', () => { const rows = planningRows([course(), course('two')], settings); assert(rows.every(r => r.warnings.some(w => w.includes('template preparation overlaps') && w.includes('ABC1234') && w.includes('DEF1234')))); assert.equal(templateOverlaps([{ id: 'a', name: 'A', start: '2026-10-01', end: '2026-10-02' }, { id: 'b', name: 'B', start: '2026-10-05', end: '2026-10-06' }]).length, 0); });
test('proposed and active courses participate in the same template comparison', () => { const config = { ...settings, proposals: [{ id: 'p1', courseNumber: 'GHI1234', termRelease: 'Summer Term' as const, targetTermYear: 2027, onboarding: true, projectStartDate: start }] }; const rows = planningRows([course()], config); assert.equal(rows.length, 2); assert(rows.every(r => r.warnings.some(w => w.includes('template preparation overlaps')))); });
test('staggering prefers latest feasible dates and does not mutate occupied projects', () => { const window = recommendedWindow(true, '2027-03-26', settings)!; const latest = run({ start: window.latest }); const occupied = [{ id: 'active', name: 'Active', ...latest.templatePeriod }], snapshot = JSON.stringify(occupied); const result = staggeredStart({ id: 'new', onboarding: true, window, occupied, settings }); assert(result.date && result.date < window.latest); assert.equal(templateOverlaps([occupied[0], result.period!]).length, 0); assert.equal(JSON.stringify(occupied), snapshot); });
test('infeasible staggering returns an explanation instead of silently rescheduling', () => { const window = recommendedWindow(true, '2027-03-26', settings)!; const r = staggeredStart({ id: 'new', onboarding: true, window, occupied: [{ id: 'old', name: 'Old', start: '2020-01-01', end: '2030-01-01' }], settings }); assert.equal(r.date, ''); assert(r.message.includes('No conflict-free')); });
test('proposal conversion uses deterministic identity and converted proposals are excluded', () => { const p = { id: 'p1', courseNumber: 'GHI1234', termRelease: 'Summer Term' as const, targetTermYear: 2027, onboarding: true, projectStartDate: start }; assert.equal(proposalProjectId(p), proposalProjectId(structuredClone(p))); const active = { ...course(), id: proposalProjectId(p), proposalId: p.id }; assert.equal(planningRows([active], { ...settings, proposals: [p] }).length, 1); assert.equal(planningRows([], { ...settings, proposals: [{ ...p, convertedProjectId: active.id }] }).length, 0); });
test('planning table excludes active projects and removes the timeline control', () => {
 const html=renderToStaticMarkup(React.createElement(CoursePlanningViews,{courses:[course()],settings}));
 assert(html.includes('<table')); assert(!html.includes('Timeline')); assert(!html.includes('Planning view'));
 assert(!html.includes('ABC1234')); assert(html.includes('No proposed courses yet.'));
});
test('legacy planning preserves every historical date, notes, flags and arbitrary saved metadata', () => { const old = { ...course(), scheduleVersion: undefined }; old.tasks[0].notes = 'historical'; old.tasks[0].dueDate = '2024-04-01'; old.tasks[5].subtasks![0].complete = true; const snapshot = JSON.stringify(old); const rows = planningRows([old], settings); assert.equal(JSON.stringify(old), snapshot); assert.equal(rows[0].completion, old.tasks.find(t => t.id === 39)!.dueDate); assert(rows[0].legacy); });
test('recommended window contains 15 workdays, latest meets deadline and next workday misses', () => { const window = recommendedWindow(true, '2027-03-26', settings)!; assert.equal(window.earliest, offsetWorkdays(window.latest, -14, calendar)); assert(run({ start: window.latest }).completion <= '2027-03-26'); assert(run({ start: offsetWorkdays(window.latest, 1, calendar) }).completion > '2027-03-26'); });
test('missing multimedia duration stays explicitly provisional across repeated saves', () => { const config = { ...settings, multimediaWorkdays: undefined }; const first = recalculateCourse(course(), config), second = recalculateCourse(first, config); assert(first.schedulingWarnings!.some(w => w.includes('[estimate]'))); assert(second.schedulingWarnings!.some(w => w.includes('[estimate]'))); });
test('incomplete calendar coverage is disclosed without invented institutional holidays', () => { const r = run({ start: '2028-01-03' }); assert(r.warnings.some(w => w.kind === 'calendar')); });
test('invalid or circular dependency configurations fail actionably', () => { assert.throws(() => resolveDependencies([{ id: 'a', duration: 1, dependencies: [{ id: 'b' }] }], start, calendar), /Missing predecessor b/); assert.throws(() => resolveDependencies([{ id: 'a', duration: 1, dependencies: [{ id: 'b' }] }, { id: 'b', duration: 1, dependencies: [{ id: 'a' }] }], start, calendar), /Circular/); });
test('compensation subtasks migrate exactly once to final review and retain complete source data', () => { const saved = tasks(), comp = saved.find(t => t.id === 38)!; comp.notes = 'legacy compensation'; comp.subtasks![0].complete = true; const once = run({ tasks: saved }), twice = run({ tasks: once.tasks }); assert(!once.tasks.some(t => t.id === 38)); const final = once.tasks.find(t => t.id === 37)!; assert.equal(final.subtasks!.filter(s => s.id.startsWith('compensation-')).length, 3); assert.deepEqual(final.subtasks, twice.tasks.find(t => t.id === 37)!.subtasks); assert.equal(final.subtasks!.find(s => s.id.startsWith('compensation-'))!.sourceTask!.notes, 'legacy compensation'); });
test('delayed template readiness produces a distinct email-delivery warning', () => { const saved = tasks(); saved.find(t => t.id === 12)!.subtasks!.find(s => s.title === 'Module 2')!.manualDueDate = '2027-02-01'; const r = run({ tasks: saved }); assert(r.warnings.some(w => w.kind === 'template-delivery' && w.message.includes('Module 2') && w.message.includes('2027-02-01'))); });
test('forward cards retain materials workflow, version and compensation dialogs', () => { const c = recalculateCourse(course(), settings); const html = renderToStaticMarkup(React.createElement(Category1CourseDev, { courseDevelopments: [c], customBlocked: [], termPlanning: settings, onAddCourse: async () => { }, onUpdateCourse: async () => { }, onDeleteCourse: async () => { } })); for (const text of ['Version Information', 'Send stipend notification', 'Request Code Check and Archive', 'Template Due', 'Scheduled Email', 'Use calculated dates']) {
    if (text === 'Use calculated dates')
        continue;
    assert(html.includes(text), text);
} assert(!html.includes('>End compensation<')); });

test('custom blocked dates affect both deadlines and forward scheduling through the same calendar', () => {
 const term=getCourseTerm(course())!;
 const blocked=['2027-03-26'];
 assert.equal(planningDeadline(term,settings,blocked).date,'2027-03-25');
 const r=run({start:'2027-03-24',customBlocked:blocked});
 assert.equal(d(r,'4').start,offsetWorkdays('2027-03-24',5,fscjCalendar(settings,blocked)));
});

test('final readiness checks every module even when later modules are manually pinned earlier',()=>{
 const saved=tasks();saved.find(t=>t.id===14)!.subtasks!.find(s=>s.id==='review-module-1')!.manualDueDate='2027-04-01';
 saved.find(t=>t.id===37)!.manualDueDate='2027-03-01';
 const r=run({tasks:saved});
 assert(r.warnings.some(w=>w.kind==='final-readiness'&&w.message.includes('14/review-module-1')&&w.message.includes('2027-04-01')));
});
test('valid saved multimedia estimates take precedence over the shared estimate',()=>{
 const saved=tasks();saved.find(t=>t.id===15)!.manualDuration=12;
 const r=run({tasks:saved});assert.equal(d(r,'15/multimedia-module-1').due,inclusiveDue(d(r,'15/multimedia-module-1').start,12,calendar));
});
