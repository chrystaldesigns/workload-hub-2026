# Forward scheduling and term planning

New courses use `scheduleVersion: 1` and a selected `projectStartDate`. Existing courses retain their persisted task arrays on load and unrelated saves. **Save & Recalculate Schedule** explicitly opts an existing course in, retaining a full `legacyScheduleSnapshot` and preserving actual manual overrides and completed work. The Project Start Date is a local draft until this action is saved. Use **Use calculated dates** or clear a module override to release a constraint. Changing the project start recomputes the network; explicit overrides remain fixed. No deployment data migration or bulk write is required.

## Dependency model

`fscjCalendar.ts` performs date-only UTC arithmetic. `offsetWorkdays` excludes its anchor; `inclusiveDue` includes day one; same-day relationships use zero offset and next-workday relationships use one. Closure dates and verified coverage come from the editable central FSCJ operating calendars, with user blocked dates included. Missing verification/coverage produces provisional-calendar warnings. Deadlines use this same arithmetic, 30 increments before official Session A. Published dates remain sourced and missing terms remain undated.

`forwardSchedule.ts` resolves a typed dependency graph topologically and detects missing, duplicate, or circular nodes. Stable task IDs remain compatible with saved records; displayed numbers run 1–26. Onboarding controls Tasks 2–4, while compensation Task 1 remains independent. Five-workday coordination allowances are buffers rather than summed labor. Meetings may occur earlier within those allowances. Module development uses five inclusive days and shared-day boundaries; review/build and Quickbase requests share the content due date.

Multimedia runs in parallel from each module request. Valid saved estimates are retained; otherwise a one-workday **provisional placeholder** is explicitly flagged until the user confirms an estimate. Course-specific estimates override the shared planning estimate. Documents begin on Module 7 review completion, with three increments for SME feedback. Proofreading and pre-QA run together for five inclusive days; QA takes five inclusive days without another correction buffer. Final review defaults to five increments after QA and waits for the longest readiness dependency. Manual early final review dates remain selected and identify unfinished work. Midpoint is flexible and never constrained by unfinished Module 4. Course completion reserves five inclusive workdays after final review.

Templates begin with Complete CDP. Module 1 is due/delivered at kickoff; Modules 2–7 each take one subsequent workday. Each child separately stores template readiness and its scheduled delivery reference (one workday before the previous module's SME due date). Task 11 ends on final template preparation, not the final email. No emails are sent automatically. Former End Compensation children and their full source records move into final review exactly once; compensation dialogs remain available there.

## Planning and proposals

The recommended window solves the actual forward graph backward from the administrative deadline by evaluating candidate workday starts. It ends on the latest safe start and contains 15 workdays by default (editable). Earlier selected starts are permitted; late starts and projected missed deadlines warn without blocking saving. Fixed manual dates remain user decisions and may invalidate a theoretical recommended window; their actual projection and conflicts are displayed separately.

`planningRows.ts` supplies the proposed-course comparison table with target term, onboarding, window, suggested and selected starts, template preparation, meetings, completion, deadline, and Session A. Active projects (including legacy schedules using saved dates) remain background workload constraints, while only unconverted proposals appear in the table. The timeline view and toggle have been removed. Only template preparation periods create cross-course workload conflicts. Advisory staggering searches backward from the latest start within the recommended window, considering active and proposed periods. It leaves selected schedules unchanged and explains when no conflict-free option exists within that window. Earlier manual starts remain possible.

Proposals persist separately in `calendar-settings/settings.termPlanning.proposals`. No assignment date is required. Accept a suggestion or select a start, then **Create Project** opens the existing course form prefilled with number, term/year, onboarding, and start. All existing materials and people fields remain available. The course and converted marker are committed in a single Firestore transaction, with a deterministic project ID making retries idempotent. Active project identity also suppresses converted proposals from planning comparisons. Canceling leaves the proposal intact.

## Changed files

- `src/utils/fscjCalendar.ts`: shared date-only work calendar and coverage checks.
- `src/utils/forwardSchedule.ts`: dependency solver, scheduling, overrides, readiness, backward windows, template overlaps, staggering.
- `src/utils/proposedPlanning.ts`: filters proposals after scheduling all courses and validates isolated selected-date updates.
- `src/utils/planningRows.ts`: shared active/proposed projections and proposal identity.
- `src/utils/termPlanning.ts`: settings, proposals, estimate/window validation, unified deadline arithmetic; removed dependency on the legacy calendar engine.
- `src/utils/courseTaskStructure.ts`: proofreading dialogs use current projected child dates while retaining archived source records.
- `src/types.ts`: additive schedule, override, warning, template date and snapshot fields.
- `src/components/CoursePlanningViews.tsx`: proposal form, proposal-only comparison table, accessible acceptance button, saving/applied/error feedback, and warnings.
- `src/components/TermPlanningSection.tsx`: functional windows and editable planning estimates/calendar settings.
- `src/components/Dashboard.tsx`: connects course planning data/actions.
- `src/components/Category1_CourseDev.tsx`: project start and manual overrides, opt-in adoption, warnings, template labels, preserved dialogs, proposal-prefilled creation.
- `src/App.tsx`: preserves saved schedules on load, recalculates forward projects on saves, handles planning navigation.
- `server.ts`: atomic, idempotent proposal conversion in the existing authenticated course API.
- `tests/forwardSchedule.test.ts`: scheduling, override, conflict, planning, rendering, preservation and conversion-identity coverage.
- `tests/proposedPlanning.test.ts`: proposal visibility, hidden workload constraints, persistence, and mounted DOM workflows; jsdom is a test-only dependency.
- `tests/termPlanning.test.ts`: functional window expectations.

## Validation and limits

109 automated tests pass, including 16 Course Management regression tests and 10 proposal-refinement tests; TypeScript and production build pass. The repository's lint command is a placeholder and reports no lint problems; it does not run a static-analysis linter. The build reports a JavaScript chunk larger than 500 kB. A read-only Firestore audit examined all eight saved projects and verified unchanged inputs and retained legacy completion dates, with zero writes. Mounted React DOM tests exercise Accept Suggestion, immediate feedback, save failure rollback, duplicate click protection, reload persistence, manual dates, filtering, proposal creation and conversion handoff. Course Management tests also mount the full course screen to verify course switching, draft isolation, save failures, successful persistence and immediate schedule refresh. The in-app browser was unavailable, so authenticated click-through and visual browser verification could not be performed. Firestore transaction retries are protected by deterministic identity; no test projects were written to production.

Missing future term dates, incomplete calendar coverage, and unconfirmed multimedia estimates remain visible limitations, not fabricated confirmed schedules.

## Course Management scheduling repair

The former project-start input saved on change, while Recalculate opened a separate prompt. The prior adoption handler also copied every historical/projected date into manual fields, pinning the dependency network. The replacement controls keep a course-specific draft and use one explicit save action; successful API responses update local course state before the dashboard reload. Feedback is shown only after persistence succeeds; failures retain the draft. The per-course multimedia estimate input is removed. Existing stored estimates, shared planning configuration, multimedia dependencies and the explicit provisional fallback remain internal scheduling inputs; final review still checks all seven multimedia modules.

`courseScheduleManagement.ts` validates and prepares an explicit recalculation. For courses affected by the earlier adoption bug, overrides are released only if they match their pre-adoption snapshot, were not originally manual, have no explicit override flag, and are not completed work. Changed or flagged overrides remain pinned. `scheduleOverrideVersion` makes this a one-time repair; new user date edits carry explicit override provenance. The original snapshot and Task 1 remain unchanged. Legacy completed module dates are captured before structural migration.

Added files: `src/components/CourseManagementControls.tsx`, `src/utils/courseScheduleManagement.ts`, and `tests/courseScheduleManagement.test.ts`. A read-only audit of all eight production records tested the repair on an in-memory copy of the one forward-scheduled course: 50 bulk-generated task date fields were released, projected completion changed, and compensation plus the original snapshot remained unchanged. No production records were written; the repair runs only when the user saves a recalculation.
