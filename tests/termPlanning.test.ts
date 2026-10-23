import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CourseDevelopment, TermRelease } from '../src/types';
import { TargetTermFields, TargetTermSummary } from '../src/components/TargetTermFields';
import { TermPlanningSection } from '../src/components/TermPlanningSection';
import { Dashboard } from '../src/components/Dashboard';
import { buildCourseDevelopmentTimeline } from '../src/components/Category1_CourseDev';
import { migrateCourseTaskStructure } from '../src/utils/courseTaskStructure';
import { TARGET_TERMS, OFFICIAL_TERM_PLANNING, TERM_SOURCE, OPERATING_SOURCE, VERIFIED_ON, normalizeTermRelease, courseTargetYear, courseTargetLabel, targetTermFields,
  getCourseTerm, planningDeadline, upcomingTerms, getTermPlanningSettings, validateTermPlanningSettings, validateCourseTargetTerm, validISODate, termId, termAcademicYear } from '../src/utils/termPlanning';

const config = () => structuredClone(OFFICIAL_TERM_PLANNING);
const term = (name: string) => config().terms.find((term) => term.term === name)!;
const course = (): CourseDevelopment => ({
  id: 'term-test', courseNumber: 'TEST1234', courseTitle: 'Test', program: 'Test', canvasVersion: 'cel-test-v1', workshopCourse: '',
  devType: 'Original', versionNumber: 1, termRelease: 'Spring B', termDeadline: '2027-01-11', devStagger: 0, onboarding: true,
  hideCompletedTasks: false, alertStatus: 'No Concerns', celTeam: { golf: '', chrystal: '', admin: '' },
  deptTeam: { smeName: '', smeEmail: '', deanName: '', deanEmail: '' }, tasks: buildCourseDevelopmentTimeline('2027-05-03', true),
});

test('Target Term Release exposes exactly three labels with no session letters or years and retains an optional select', () => {
  const html = renderToStaticMarkup(React.createElement(TargetTermFields, {
    termRelease: 'Spring B', targetTermYear: '2027', onTermChange: () => {}, onYearChange: () => {},
  }));
  const select = html.match(/<select[\s\S]*?<\/select>/)![0];
  assert.deepEqual([...select.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map((match) => match[1]), TARGET_TERMS);
  assert(!select.includes('required'));
  assert(select.includes('value="Spring Term" selected=""'));
  assert(html.includes('name="targetTermYear"'));
});

test('legacy session values normalize on edit, retain the original selection, and persist a separate term year', () => {
  for (const season of ['Spring', 'Summer', 'Fall']) for (const session of ['A', 'B', 'C']) {
    assert.equal(normalizeTermRelease(`${season} ${session}`), `${season} Term`);
  }
  assert.equal(normalizeTermRelease('spring term 2028'), 'Spring Term');
  assert.equal(normalizeTermRelease('Unknown'), undefined);
  const old = course(), before = JSON.stringify(old);
  const updated = JSON.parse(JSON.stringify({ ...old, ...targetTermFields(old.termRelease, String(courseTargetYear(old)), old) }));
  assert.equal(updated.termRelease, 'Spring Term');
  assert.equal(updated.originalTermRelease, 'Spring B');
  assert.equal(updated.targetTermYear, 2027);
  assert.equal(courseTargetLabel(updated), 'Spring Term 2027');
  assert.equal(JSON.stringify(old), before);
  assert.deepEqual(updated.tasks, old.tasks);
});

test('explicit, legacy academic, and embedded years are respected without conflating Spring 2027 and 2028', () => {
  assert.equal(courseTargetYear({ ...course(), targetTermYear: 2028 }), 2028);
  assert.equal(courseTargetYear({ termRelease: 'Spring Term', academicYear: '2026-2027' }), 2027);
  assert.equal(courseTargetYear({ termRelease: 'Fall A', academicYear: '2026–2027' }), 2026);
  assert.equal(courseTargetYear({ termRelease: 'Spring A', academicYear: '2026-27' }), 2027);
  assert.equal(courseTargetYear({ termRelease: 'Spring Term 2028' as TermRelease }), 2028);
  assert.equal(courseTargetYear({ termRelease: 'Spring A' }), undefined);
  assert.equal(getCourseTerm({ ...course(), targetTermYear: 2027 })!.sessionAStartDate, '2027-01-11');
  assert.equal(getCourseTerm({ ...course(), targetTermYear: 2028 }), undefined);
  assert.equal(courseTargetLabel({ ...course(), targetTermYear: 2028 }), 'Spring Term 2028');
});

test('published Session A dates retain authoritative sources and verification metadata', () => {
  assert.deepEqual(config().terms.map((term) => term.sessionAStartDate), ['2026-08-31', '2027-01-11', '2027-05-10']);
  assert.equal(validateTermPlanningSettings(config()), '');
  for (const record of config().terms) {
    assert.equal(record.sourceUrl, TERM_SOURCE);
    assert.equal(record.lastVerifiedDate, VERIFIED_ON);
    assert.equal(record.verificationStatus, 'verified');
    assert.equal(record.academicYear, '2026-2027');
    assert(record.operatingCalendarId);
  }
  assert.equal(config().operatingCalendars[0].sourceUrl, OPERATING_SOURCE);
});

test('30-workday deadlines skip weekends, official breaks, holidays, and flexible-workweek Fridays', () => {
  assert.equal(planningDeadline(term('Fall Term')).date, '2026-07-13');
  assert.equal(planningDeadline(term('Spring Term')).date, '2026-11-10');
  assert.equal(planningDeadline(term('Summer Term')).date, '2027-03-26');
  const calendar = config().operatingCalendars[0];
  for (const record of config().terms) {
    const deadline = planningDeadline(record);
    assert.equal(deadline.confirmed, true);
    // Same backward-step convention as the existing scheduling helper: start
    // date excluded, the date reached on the thirtieth workday is the deadline.
    const date = new Date(`${record.sessionAStartDate}T12:00:00`);
    let count = 0;
    while (date.toISOString().slice(0, 10) > deadline.date) {
      date.setDate(date.getDate() - 1);
      const iso = [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
      if (![0,6].includes(date.getDay()) && !calendar.closedDates.includes(iso)) count++;
    }
    assert.equal(count, 30);
  }
  for (const date of ['2026-11-11','2026-11-25','2026-12-21','2026-12-22','2026-12-23','2027-01-01','2027-03-19','2027-05-07']) assert(calendar.closedDates.includes(date));
});

test('missing dates stay unknown and a missing or incomplete operating calendar makes the deadline provisional', () => {
  const upcoming = upcomingTerms('2026-10-23');
  assert.deepEqual(upcoming.map((record) => `${record.term} ${record.year}`), ['Spring Term 2027','Summer Term 2027','Fall Term 2027']);
  assert.equal(upcoming[2].sessionAStartDate, undefined);
  assert.equal(planningDeadline(upcoming[2]).date, '');
  assert.equal(planningDeadline(upcoming[2]).confirmed, false);
  const future = { ...term('Fall Term'), id: 'fall-2027', year: 2027, sessionAStartDate: '2027-08-30', operatingCalendarId: 'unpublished' };
  const provisional = planningDeadline(future);
  assert(provisional.date);
  assert.equal(provisional.confirmed, false);
  assert(provisional.message.includes('Provisional'));
  const limited = config(); limited.operatingCalendars[0].coverageStart = '2027-01-01';
  assert.equal(planningDeadline(term('Spring Term'), limited).confirmed, false);
});

test('manual corrections are cached and survive JSON persistence without replacing other confirmed dates', () => {
  const saved = config();
  saved.terms[1] = { ...saved.terms[1], sessionAStartDate: '2027-01-12', verificationStatus: 'manual' };
  const restored = getTermPlanningSettings(JSON.parse(JSON.stringify(saved)));
  assert.equal(getCourseTerm(course(), restored)!.sessionAStartDate, '2027-01-12');
  assert.equal(planningDeadline(restored.terms.find((record) => record.term === 'Spring Term'), restored).confirmed, false);
  assert.equal(restored.terms.find((record) => record.term === 'Summer Term')!.sessionAStartDate, '2027-05-10');
  assert.equal(getTermPlanningSettings().terms.find((record) => record.term === 'Spring Term')!.sessionAStartDate, '2027-01-11');
});

test('calendar validation rejects ambiguous dates, nonofficial sources, duplicate records, and invalid coverage', () => {
  assert(!validISODate('2027-02-30'));
  const wrong = config(); wrong.terms[0].sessionAStartDate = '2026-02-30';
  assert(validateTermPlanningSettings(wrong));
  wrong.terms[0].sessionAStartDate = '2026-08-31'; wrong.terms[0].sourceUrl = 'https://example.com/calendar';
  assert(validateTermPlanningSettings(wrong));
  const duplicated = config(); duplicated.terms.push(duplicated.terms[0]); assert(validateTermPlanningSettings(duplicated));
  const coverage = config(); coverage.operatingCalendars[0].coverageEnd = '2025-01-01'; assert(validateTermPlanningSettings(coverage));
  assert(validateTermPlanningSettings({ terms: [null], operatingCalendars: [] }));
  const noDate = config(); delete noDate.terms[0].sessionAStartDate; assert(validateTermPlanningSettings(noDate));
  assert.equal(termAcademicYear('Fall Term',2027), '2027-2028');
  assert.equal(termId('Spring Term',2028), 'spring-2028');
});

test('dashboard cards show three upcoming terms, sources, verification, and pending forward-scheduling windows', () => {
  const html = renderToStaticMarkup(React.createElement(TermPlanningSection, { today: '2026-10-23', onSave: async () => {} }));
  assert(html.includes('FSCJ Term Release Planning'));
  assert.equal((html.match(/Pending scheduling configuration/g) || []).length, 3);
  assert(html.includes('Spring Term 2027'));
  assert(html.includes('Summer Term 2027'));
  assert(html.includes('Fall Term 2027'));
  assert(html.includes('January 11, 2027'));
  assert(html.includes('November 10, 2026'));
  assert(html.includes('March 26, 2027'));
  assert(html.includes('Requires confirmation'));
  assert(html.includes('Last verified: 2026-10-23'));
  assert(html.includes(TERM_SOURCE));
  assert(html.includes('Manage term dates'));
  assert(!html.includes('August 30, 2027'));
});

test('course summaries distinguish an unpublished target year and never modify project task dates', () => {
  const original = course(), before = JSON.stringify(original);
  const datesBefore = migrateCourseTaskStructure(original.tasks);
  const selected = { ...original, ...targetTermFields('Summer Term', 2027, original) };
  assert.equal(getCourseTerm(selected)!.sessionAStartDate, '2027-05-10');
  assert.deepEqual(migrateCourseTaskStructure(selected.tasks), datesBefore);
  assert.equal(selected.termDeadline, original.termDeadline);
  assert.equal(JSON.stringify(original), before);
  const unknown = renderToStaticMarkup(React.createElement(TargetTermSummary, { termRelease: 'Spring Term', targetTermYear: 2028 }));
  assert(unknown.includes('requires confirmation'));
  const dashboard = renderToStaticMarkup(React.createElement(Dashboard, { courseDevelopments: [selected], lssProjects: [], standaloneTasks: [], onNavigate: () => {} }));
  assert(dashboard.includes('FSCJ Term Release Planning'));
});


test('missing cached dates cannot erase confirmed dates and invalid target years are rejected without affecting legacy records', () => {
  const incomplete = config();
  incomplete.terms[1] = { ...incomplete.terms[1], sessionAStartDate: undefined, verificationStatus: 'unconfirmed' };
  assert.equal(getTermPlanningSettings(incomplete).terms.find((term) => term.id === 'spring-2027')!.sessionAStartDate, '2027-01-11');
  assert.equal(validateCourseTargetTerm(course()), '');
  assert.equal(validateCourseTargetTerm({ targetTermYear: 2028 }), '');
  assert(validateCourseTargetTerm({ targetTermYear: 0 }));
  assert(validateCourseTargetTerm({ targetTermYear: 2027.5 }));
  assert(validateCourseTargetTerm({ targetTermYear: '2027' } as any));
});
