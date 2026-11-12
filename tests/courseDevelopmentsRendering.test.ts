import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act, useState } from 'react';
import { JSDOM } from 'jsdom';
import { Category1CourseDev, buildCourseDevelopmentTimeline } from '../src/components/Category1_CourseDev';
import { Navigation } from '../src/components/Navigation';
import type { CourseDevelopment } from '../src/types';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document,
  HTMLElement: dom.window.HTMLElement, localStorage: dom.window.localStorage,
  IS_REACT_ACT_ENVIRONMENT: true,
});
const { createRoot } = await import('react-dom/client');

const fixture = (): CourseDevelopment => ({
  id: 'saved-course', courseNumber: 'ABC1234', courseTitle: 'Saved development',
  program: 'Test', canvasVersion: 'v1', workshopCourse: '', devType: 'Original',
  versionNumber: 1, termRelease: 'Summer Term', targetTermYear: 2027,
  termDeadline: '2027-05-10', devStagger: 14, onboarding: true,
  deptTeam: {} as CourseDevelopment['deptTeam'], celTeam: {} as CourseDevelopment['celTeam'],
  hideCompletedTasks: false, alertStatus: 'No Concerns',
  tasks: buildCourseDevelopmentTimeline('2027-03-26', true),
});

for (const teamState of ['present', 'missing', 'null', 'production-date-range', 'noncompliant-range'] as const) {
  test(`Course Developments navigation renders a saved course with ${teamState} department team without writes`, async () => {
    const course = fixture();
    if (teamState === 'missing') delete course.deptTeam;
    if (teamState === 'null') Object.assign(course, { deptTeam: null });
    if (teamState === 'production-date-range' || teamState === 'noncompliant-range') {
      // Exact date pair from the affected production record; no private record data.
      course.termDeadline = '2027-08-30';
      course.tasks.find(task => task.name === 'Course completion')!.dueDate =
        teamState === 'production-date-range' ? '0002-03-22' : '2027-08-27';
    }
    const before = JSON.stringify(course);
    let writes = 0;
    const container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.setItem('workloadHubSelectedCourseId', 'stale-course-id');
    function Harness() {
      const [tab, setTab] = useState('dashboard');
      return React.createElement(React.Fragment, null,
        React.createElement(Navigation, { activeTab: tab, setActiveTab: setTab, alertCount: 0 }),
        tab === 'category1' && React.createElement(Category1CourseDev, {
          courseDevelopments: [course], customBlocked: [],
          onAddCourse: async () => { writes++; },
          onUpdateCourse: async () => { writes++; },
          onDeleteCourse: async () => { writes++; },
        }));
    }
    const root = createRoot(container);
    try {
      await act(async () => root.render(React.createElement(Harness)));
      const navigation = [...container.querySelectorAll('nav button')].find(button => button.textContent === 'Course Developments')!;
      await act(async () => (navigation as HTMLButtonElement).click());
      assert.match(container.textContent!, /ABC1234: Saved development/);
      assert.match(container.textContent!, /Development Timeline and Milestones/);
      assert.match(container.textContent!, /Not entered/);
      if (teamState === 'production-date-range') {
        assert.match(container.querySelector('[role="alert"]')!.textContent!, /Closeout compliance could not be calculated/);
        assert.doesNotMatch(container.textContent!, /CRITICAL SYSTEM NON-COMPLIANCE/);
      } else if (teamState === 'noncompliant-range') {
        assert.match(container.textContent!, /CRITICAL SYSTEM NON-COMPLIANCE/);
        assert.equal(container.querySelector('[role="alert"]'), null);
      } else {
        assert.equal(container.querySelector('[role="alert"]'), null);
      }
      assert.equal(writes, 0);
      assert.equal(JSON.stringify(course), before);
    } finally {
      await act(async () => root.unmount());
      container.remove();
      localStorage.clear();
    }
  });
}
