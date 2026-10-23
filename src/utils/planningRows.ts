import type { CourseDevelopment } from '../types';
import { courseTargetLabel, getCourseTerm, planningDeadline, type TermPlanningSettings, type ProposedCourse } from './termPlanning';
import { forwardSchedule, recommendedWindow, staggeredStart, templateOverlaps, type TemplatePeriod } from './forwardSchedule';
export function planningRows(courses: CourseDevelopment[], settings?: TermPlanningSettings, customBlocked: string[] = []) {
    const inputs = [...courses.filter(c => !c.archived).map(course => ({ id: course.id!, course, status: 'Active' as const })), ...(settings?.proposals || []).filter(p => !p.convertedProjectId && !courses.some(c => c.proposalId === p.id)).map(proposal => ({ id: proposal.id, course: proposal as Partial<CourseDevelopment>, status: 'Proposed' as const }))];
    const rows = inputs.map(input => {
        const c = input.course, term = getCourseTerm(c, settings), deadline = planningDeadline(term, settings, customBlocked), window = recommendedWindow(!!c.onboarding, deadline.date, settings, customBlocked, c.multimediaWorkdays, c.tasks);
        const savedStart = c.projectStartDate || (input.status === 'Active' ? c.tasks?.find(t => String(t.id) === String(c.onboarding ? 2 : 5))?.startDate : '');
        // Active legacy records use their persisted dates, never an implicit forward migration.
        const projected = savedStart ? forwardSchedule({ start: savedStart, onboarding: !!c.onboarding, tasks: c.scheduleVersion === 1 ? c.tasks : undefined, settings, customBlocked, multimediaWorkdays: c.multimediaWorkdays, courseNumber: c.courseNumber, deadline: deadline.date }) : null;
        const legacy = input.status === 'Active' && c.scheduleVersion !== 1;
        const template = legacy ? c.tasks?.find(t => String(t.id) === '12') : undefined;
        return { ...input, name: c.courseNumber || 'Course', term: courseTargetLabel(c), session: term?.sessionAStartDate || '', deadline: deadline.date, window, selected: savedStart || '', completion: legacy ? c.tasks?.find(t => String(t.id) === '39')?.dueDate || '' : projected?.completion || '', period: legacy ? { start: template?.startDate || '', end: template?.dueDate || '' } : projected?.templatePeriod || { start: '', end: '' }, meetings: legacy ? (c.tasks || []).filter(t => [4, 6, 11, 21, 37].includes(Number(t.id))).map(t => ({ name: t.name, date: t.dueDate || '' })) : projected ? ['4', '6', '11', '21', '37'].filter(id => projected.dates[id]).map(id => ({ name: ({ '4': 'Onboarding', '6': 'Initial', '11': 'Kickoff', '21': 'Midpoint', '37': 'Final review' } as Record<string, string>)[id], date: projected.dates[id].due })) : [], warnings: [...(legacy ? ['Saved legacy schedule — use Adopt forward schedule in the project to recalculate.'] : projected?.warnings.map(w => w.message) || []), ...(!deadline.confirmed ? [deadline.message] : [])], suggested: '', legacy };
    });
    let occupied: TemplatePeriod[] = rows.filter(r => r.period.start && r.period.end).map(r => ({ id: r.id, name: r.name, ...r.period }));
    for (const row of rows) {
        if (!row.window)
            continue;
        const suggestion = staggeredStart({ id: row.id, onboarding: !!row.course.onboarding, window: row.window, occupied, settings, customBlocked, multimediaWorkdays: row.course.multimediaWorkdays });
        row.suggested = suggestion.date;
        if (!row.window.calendarConfirmed) row.warnings.push(`${row.name}: recommended window ${row.window.earliest}–${row.window.latest} uses incomplete verified operating-calendar coverage.`);
        if (suggestion.message)
            row.warnings.push(suggestion.message);
        if (!row.legacy && !row.selected && suggestion.period) {
            row.period = { start: suggestion.period.start, end: suggestion.period.end };
            const projection = forwardSchedule({ start: suggestion.date, onboarding: !!row.course.onboarding, settings, customBlocked, multimediaWorkdays: row.course.multimediaWorkdays, courseNumber: row.name, deadline: row.deadline });
            row.completion = projection.completion;
            row.meetings = ['6', '11', '21', '37'].map(id => ({ name: ({ '6': 'Initial', '11': 'Kickoff', '21': 'Midpoint', '37': 'Final review' } as Record<string, string>)[id], date: projection.dates[id].due }));
            row.warnings.push(...projection.warnings.map(w => w.message));
            occupied.push({ ...suggestion.period, name: row.name });
        }
    }
    const overlaps = templateOverlaps(rows.filter(r => r.period.start && r.period.end).map(r => ({ id: r.id, name: r.name, ...r.period })));
    for (const row of rows) {
        row.warnings.push(...overlaps.filter(w => w.a === row.id || w.b === row.id).map(w => w.message));
        if (row.deadline && row.completion > row.deadline)
            row.warnings.push(`${row.name}: completion ${row.completion} exceeds deadline ${row.deadline}.`);
        if (row.window && row.selected > row.window.latest)
            row.warnings.push(`${row.name}: selected start ${row.selected} is later than latest safe start ${row.window.latest}.`);
    }
    return rows;
}
export const proposalProjectId = (proposal: Pick<ProposedCourse, 'id'>) => `proposal-${proposal.id}`;
