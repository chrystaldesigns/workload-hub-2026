import type { CourseDevelopment, CourseDevelopmentTask, CourseDevelopmentSubtask } from '../types';
import { fscjCalendar, getCourseTerm, planningDeadline, type TermPlanningSettings } from './termPlanning';
import { calendarCovered, inclusiveDue, normalizeWorkday, offsetWorkdays, working, type WorkCalendar } from './fscjCalendar';
export type WarningKind = 'dependency' | 'workload' | 'deadline' | 'template-delivery' | 'final-readiness' | 'calendar' | 'estimate';
export interface ScheduleWarning {
    kind: WarningKind;
    task: string;
    message: string;
}
export interface Dependency {
    id: string;
    boundary?: 'start' | 'due';
    offset?: number;
}
export interface ScheduleNode {
    id: string;
    dependencies: Dependency[];
    duration: number;
    manualStart?: string | null;
    manualDue?: string | null;
    earliestDependencies?: Dependency[];
    flexible?: boolean;
}
export interface NodeDates {
    start: string;
    due: string;
    autoStart: string;
    autoDue: string;
}
/** Topological dependency resolution, including negative reminder offsets. */
export function resolveDependencies(nodes: ScheduleNode[], start: string, calendar: WorkCalendar) {
    const byId = new Map(nodes.map(n => [n.id, n]));
    if (byId.size !== nodes.length)
        throw new Error('Duplicate scheduling node. Use unique task identifiers.');
    const dates: Record<string, NodeDates> = {}, visiting = new Set<string>();
    const warnings: ScheduleWarning[] = [];
    function visit(id: string): NodeDates {
        if (dates[id])
            return dates[id];
        const node = byId.get(id);
        if (!node)
            throw new Error(`Missing predecessor ${id}. Review task dependencies.`);
        if (visiting.has(id))
            throw new Error(`Circular task dependency at ${id}. Remove the cycle.`);
        visiting.add(id);
        const required = node.dependencies.map(dep => { const date = visit(dep.id); return offsetWorkdays(dep.boundary === 'start' ? date.start : date.due, dep.offset || 0, calendar); });
        const autoStart = required.length ? required.sort().at(-1)! : normalizeWorkday(start, calendar);
        const effectiveStart = node.manualStart || (node.duration === 1 && node.manualDue ? node.manualDue : autoStart);
        const earliest = node.earliestDependencies?.map(dep => { const date = visit(dep.id); return offsetWorkdays(dep.boundary === 'start' ? date.start : date.due, dep.offset || 0, calendar); }).sort().at(-1) || autoStart;
        const autoDue = inclusiveDue(effectiveStart, node.duration, calendar), due = node.manualDue || autoDue;
        if (!node.flexible && ((required.length && effectiveStart < earliest) || due < effectiveStart || due < autoDue))
            warnings.push({ kind: 'dependency', task: id, message: `${id}: selected ${effectiveStart}–${due}; dependency/duration requires earliest start ${earliest} and due ${autoDue}.` });
        if (!working(effectiveStart, calendar) || !working(due, calendar))
            warnings.push({ kind: 'dependency', task: id, message: `${id}: selected ${effectiveStart}–${due} includes a nonworking boundary.` });
        visiting.delete(id);
        return dates[id] = { start: effectiveStart, due, autoStart, autoDue };
    }
    nodes.forEach(n => visit(n.id));
    return { dates, warnings };
}
const dep = (id: string, offset = 0, boundary: 'start' | 'due' = 'due'): Dependency => ({ id, offset, boundary });
const MAIN_IDS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 20, 21, 25, 26, 24, 31, 33, 34, 35, 36, 37, 39];
export function forwardSchedule(input: {
    start: string;
    onboarding: boolean;
    tasks?: CourseDevelopmentTask[];
    settings?: TermPlanningSettings;
    customBlocked?: string[];
    multimediaWorkdays?: number;
    courseNumber?: string;
    deadline?: string;
}) {
    const calendar = fscjCalendar(input.settings, input.customBlocked), existing = input.tasks || [], nodes: ScheduleNode[] = [];
    const main = (id: number, deps: Dependency[], duration = 1, flexible = false) => { const t = existing.find(t => String(t.id) === String(id)); nodes.push({ id: String(id), dependencies: deps, duration, manualStart: t?.manualStartDate, manualDue: t?.manualDueDate, flexible }); };
    if (input.onboarding) {
        main(2, []);
        main(4, [dep('2', 5)]);
        main(3, [dep('4', -2)]);
    }
    if (input.onboarding)
        nodes.find(n => n.id === '4')!.earliestDependencies = [dep('2')];
    main(5, input.onboarding ? [dep('4')] : [], 6);
    main(6, [dep('5')]);
    nodes.at(-1)!.earliestDependencies = [dep('5', 0, 'start')];
    main(7, [dep('6', 1)], 5);
    main(9, [dep('7', 1)], 3);
    main(11, [dep('9', 5)]);
    nodes.at(-1)!.earliestDependencies = [dep('9')];
    main(10, [dep('11', -2)]);
    // The scheduling allowance is a buffer; task effort remains metadata on the existing record.
    const warnings: ScheduleWarning[] = [];
    let prior = '11';
    for (let m = 1; m <= 7; m++) {
        const parent = m <= 4 ? 13 : 25, review = m <= 4 ? 14 : 26, mm = m <= 4 ? 15 : 24;
        const child = (id: string, parentId: number, deps: Dependency[], duration: number) => { const old = existing.find(t => String(t.id) === String(parentId))?.subtasks?.find(s => s.id === id); nodes.push({ id: `${parentId}/${id}`, dependencies: deps, duration, manualStart: old?.manualStartDate, manualDue: old?.manualDueDate }); };
        const development = `${parent}/develop-module-${m}`, reviewId = `${review}/review-module-${m}`, qb = `${review}/quickbase-module-${m}`;
        const parentTask = existing.find(t => String(t.id) === String(parent));
        child(`develop-module-${m}`, parent, m===5 ? Array.from({length:4},(_,i)=>dep(`13/develop-module-${i+1}`)) : [dep(prior)], 5);
        if ((m === 1 || m === 5) && parentTask?.manualStartDate)
            nodes.at(-1)!.manualStart = parentTask.manualStartDate;
        child(`review-module-${m}`, review, [dep(development)], 1);
        child(`quickbase-module-${m}`, review, [dep(reviewId)], 1);
        const mmTask = existing.find(t => String(t.id) === String(mm));
        const priorSub = mmTask?.subtasks?.find(s => s.id === `multimedia-module-${m}`);
        const savedEstimate = priorSub?.schedulingWarnings?.includes('Multimedia estimate requires confirmation.') ? undefined : priorSub?.durationDays;
        const estimate = input.multimediaWorkdays || savedEstimate || mmTask?.manualDuration || mmTask?.durationDays || input.settings?.multimediaWorkdays;
        const confirmed = Number.isInteger(estimate) && estimate! > 0;
        child(`multimedia-module-${m}`, mm, [dep(qb)], confirmed ? estimate! : 1);
        if (!confirmed)
            nodes.at(-1)!.duration = 1;
        if (!confirmed)
            warnings.push({ kind: 'estimate', task: `${mm}/multimedia-module-${m}`, message: `Module ${m} multimedia uses a provisional one-workday placeholder. Review the shared planning configuration or actual multimedia completion dates before relying on completion dates.` });
        prior = development;
    }
    main(21, Array.from({length:4},(_,i)=>dep(`14/review-module-${i+1}`,5)), 1, true);
    main(20, [dep('21', -2)], 1, true);
    main(31, [dep('26/review-module-7')], 4);
    main(33, [dep('31')], 5);
    main(34, [dep('31')], 5);
    main(35, [dep('34')], 5);
    const readiness = [...Array.from({length:7},(_,i)=>`${i<4?13:25}/develop-module-${i+1}`),...Array.from({length:7},(_,i)=>`${i<4?14:26}/review-module-${i+1}`), '31', '33', '34', '35', ...Array.from({ length: 7 }, (_, i) => `${i < 4 ? 15 : 24}/multimedia-module-${i + 1}`)];
    main(37, [dep('35', 5), ...readiness.map(id => dep(id))]);
    nodes.at(-1)!.earliestDependencies = readiness.map(id => dep(id));
    main(36, [dep('37', -2)]);
    main(39, [dep('37')], 5);
    const resolved = resolveDependencies(nodes, input.start, calendar);
    warnings.push(...resolved.warnings);
    const d = resolved.dates;
    for (const id of readiness)
        if (d[id].due > d['37'].start)
            warnings.push({ kind: 'final-readiness', task: '37', message: `Final review ${d['37'].start} precedes ${id} completion ${d[id].due}.` });
    const taskMap = new Map(existing.map(t => [String(t.id), structuredClone(t)]));
    const final = taskMap.get('37'), compensation = taskMap.get('38');
    if (final && compensation) {
        final.subtasks = [...(final.subtasks || [])];
        for (const sub of compensation.subtasks || []) {
            const id = `compensation-${sub.id}`;
            if (!final.subtasks.some(s => s.id === id))
                final.subtasks.push({ ...sub, id, sourceTask: sub.sourceTask || structuredClone(compensation) });
        }
    }
    const apply = (target: CourseDevelopmentTask | CourseDevelopmentSubtask, key: string) => { const date = d[key]; if (!date)
        return; const node = nodes.find(n => n.id === key)!; Object.assign(target, { startDate: date.start, dueDate: date.due, autoStartDate: date.autoStart, autoDueDate: date.autoDue, dependencyIds: node.dependencies.map(p => p.id), dependencyType: node.dependencies.map(p => `${p.boundary || 'due'} + ${p.offset || 0} workdays`).join('; '), durationDays: node.duration, schedulingWarnings: warnings.filter(w => w.task === key).map(w => w.message) }); };
    for (const [id, t] of taskMap) {
        if (id === '1')
            continue;
        apply(t, id);
        for (const s of t.subtasks || []) {
            apply(s, `${id}/${s.id}`);
            if (warnings.some(w => w.kind === 'estimate' && w.task === `${id}/${s.id}`))
                s.schedulingWarnings = ['Multimedia estimate requires confirmation.'];
            if (!d[`${id}/${s.id}`] && d[id])
                Object.assign(s, { startDate: s.manualStartDate || t.startDate, dueDate: s.manualDueDate || t.dueDate, autoStartDate: t.autoStartDate, autoDueDate: t.autoDueDate });
        }
        if (['13', '14', '15', '25', '26', '24'].includes(id)) {
            const children = (t.subtasks || []).filter(s => d[`${id}/${s.id}`]);
            if (children.length) {
                t.startDate = children.map(s => s.startDate!).sort()[0];
                t.dueDate = children.map(s => s.dueDate!).sort().at(-1);
                t.autoStartDate = t.startDate;
                t.autoDueDate = t.dueDate;
            }
        }
    }
    const template = taskMap.get('12');
    const templateDates = Array.from({ length: 7 }, (_, i) => i === 0 ? d['11'].start : offsetWorkdays(d['11'].start, i, calendar));
    if (template) {
        template.durationLabel = 'Module 1 by kickoff; Modules 2–7: one workday each';
        template.startDate = template.manualStartDate || d['9'].start;
        template.dueDate = template.manualDueDate || templateDates[6];
        template.autoStartDate = template.startDate;
        template.autoDueDate = template.dueDate;
        for (let m = 1; m <= 7; m++) {
            let sub = template.subtasks?.find(s => s.title === `Module ${m}` || s.id === `template-module-${m}`);
            if (!sub) {
                sub = { id: `template-module-${m}`, title: `Module ${m}`, details: '', complete: false };
                (template.subtasks ||= []).push(sub);
            }
            const email = m === 1 ? d['11'].start : offsetWorkdays(d[`${m - 1 <= 4 ? 13 : 25}/develop-module-${m - 1}`].due, -1, calendar);
            Object.assign(sub, { startDate: m === 1 ? template.startDate : templateDates[m - 1], dueDate: sub.manualDueDate || templateDates[m - 1], templateDueDate: sub.manualDueDate || templateDates[m - 1], scheduledEmailDate: email, durationDays: 1 });
            if (email < sub.templateDueDate!)
                warnings.push({ kind: 'template-delivery', task: '12', message: `Module ${m} email ${email} precedes template readiness ${sub.templateDueDate}.` });
        }
    }
    if (template) {
        template.dueDate = (template.subtasks || []).map(s => s.templateDueDate || '').sort().at(-1) || template.dueDate;
        template.autoDueDate = template.dueDate;
    }
    const intro = taskMap.get('2'), reminder = taskMap.get('3'), onboarding = taskMap.get('4'), allowance = taskMap.get('5');
    if (intro) {
        intro.durationMinutes = 10;
        intro.durationLabel = '10 minutes effort; 5-workday coordination allowance';
    }
    if (reminder) {
        reminder.durationMinutes = 5;
        reminder.durationLabel = '5 minutes';
    }
    if (onboarding) {
        onboarding.durationMinutes = 240;
        onboarding.durationLabel = '4 hours';
    }
    if (allowance)
        allowance.durationLabel = 'Up to 5-workday scheduling allowance (buffer)';
    if (template && template.startDate! > d['11'].start)
        warnings.push({ kind: 'template-delivery', task: '12', message: `Template preparation ${template.startDate} begins after Module 1 delivery ${d['11'].start}.` });
    for (const [parentId, pattern, label, date] of [['6', /schedule kickoff meeting/i, 'Schedule kickoff meeting for the week of', d['11'].start], ['11', /schedule midpoint/i, 'Schedule midpoint review meeting for the week of', d['21'].start]] as const) {
        for (const sub of taskMap.get(parentId)?.subtasks || [])
            if (pattern.test(sub.title))
                sub.title = `${label} ${date}`;
    }
    const completion = d['39'].due;
    if (input.deadline && completion > input.deadline)
        warnings.push({ kind: 'deadline', task: '39', message: `Completion ${completion} exceeds administrative deadline ${input.deadline}.` });
    if (!calendarCovered(input.start, completion, calendar))
        warnings.push({ kind: 'calendar', task: 'project', message: `Incomplete verified FSCJ calendar coverage for ${input.start}–${completion}. Dates are provisional; maintain operating calendar coverage.` });
    const tasks = MAIN_IDS.flatMap(id => { const t = taskMap.get(String(id)); if (t && [2, 3, 4].includes(id)) {
        if (!input.onboarding) {
            t.status = 'Not Applicable';
            t.startDate = '';
            t.dueDate = '';
        }
        else if (t.status === 'Not Applicable')
            t.status = 'Not Started';
    } return t ? [t] : []; }).map(t => ({ ...t, taskNumber: MAIN_IDS.indexOf(Number(t.id)) + 1 }));
    return { tasks, dates: d, warnings: warnings.map(w => ({ ...w, message: `${input.courseNumber || 'Course'} · ${taskMap.get(w.task.split('/')[0])?.name || w.task}: ${w.message}` })), completion, templatePeriod: { start: template?.startDate || d['9'].start, end: template?.dueDate || templateDates[6] }, calendar };
}
export function recalculateCourse(course: CourseDevelopment, settings?: TermPlanningSettings, customBlocked: string[] = []) {
    if (!course.projectStartDate)
        throw new Error('Select a project start date before recalculating.');
    const deadline = planningDeadline(getCourseTerm(course,settings),settings,customBlocked);
    const result = forwardSchedule({ start: course.projectStartDate, onboarding: course.onboarding, tasks: course.tasks, settings, customBlocked, multimediaWorkdays: course.multimediaWorkdays, courseNumber: course.courseNumber, deadline: deadline.date });
    const warnings = result.warnings.map(w => `[${w.kind}] ${w.message}`);
    if (!deadline.confirmed) warnings.push(`[deadline] ${course.courseNumber}: ${deadline.message}`);
    return { ...course, scheduleVersion: 1 as const, tasks: result.tasks, calculatedDeadline: result.completion, schedulingWarnings: warnings };
}
export function recommendedWindow(onboarding: boolean, deadline: string, settings?: TermPlanningSettings, customBlocked: string[] = [], multimediaWorkdays?: number, tasks?: CourseDevelopmentTask[]) {
    if (!deadline)
        return null;
    const calendar = fscjCalendar(settings, customBlocked);
    let candidate = normalizeWorkday(deadline, calendar, -1);
    // Solve the actual forward network at each candidate, rather than summing effort.
    for (let i = 0; i < 1500; i++, candidate = offsetWorkdays(candidate, -1, calendar)) {
        if (forwardSchedule({ start: candidate, onboarding, settings, customBlocked, multimediaWorkdays, tasks: tasks?.map(t => ({ ...t, manualStartDate: null, manualDueDate: null, subtasks: t.subtasks?.map(s => ({ ...s, manualStartDate: null, manualDueDate: null })) })) }).completion <= deadline)
            return { earliest: offsetWorkdays(candidate, -((settings?.planningWindowWorkdays || 15) - 1), calendar), latest: candidate, calendarConfirmed: calendarCovered(offsetWorkdays(candidate, -((settings?.planningWindowWorkdays || 15) - 1), calendar), deadline, calendar) };
    }
    throw new Error('No safe start found within 1,500 workdays. Review duration estimates and calendar.');
}
export interface TemplatePeriod {
    id: string;
    name: string;
    start: string;
    end: string;
}
export const templateOverlaps = (periods: TemplatePeriod[]) => periods.flatMap((a, i) => periods.slice(i + 1).filter(b => a.start <= b.end && b.start <= a.end).map(b => ({ a: a.id, b: b.id, start: a.start > b.start ? a.start : b.start, end: a.end < b.end ? a.end : b.end, message: `${a.name} and ${b.name}: template preparation overlaps ${a.start > b.start ? a.start : b.start}–${a.end < b.end ? a.end : b.end}.` })));
export function staggeredStart(input: {
    id: string;
    onboarding: boolean;
    window: {
        earliest: string;
        latest: string;
    };
    occupied: TemplatePeriod[];
    settings?: TermPlanningSettings;
    customBlocked?: string[];
    multimediaWorkdays?: number;
}) {
    const calendar = fscjCalendar(input.settings, input.customBlocked);
    for (let date = input.window.latest; date >= input.window.earliest; date = offsetWorkdays(date, -1, calendar)) {
        const result = forwardSchedule({ start: date, onboarding: input.onboarding, settings: input.settings, customBlocked: input.customBlocked, multimediaWorkdays: input.multimediaWorkdays });
        const period = { id: input.id, name: input.id, ...result.templatePeriod };
        if (!templateOverlaps([period, ...input.occupied.filter(p => p.id !== input.id)]).some(w => w.a === input.id || w.b === input.id))
            return { date, period, message: '' };
    }
    return { date: '', period: null, message: 'No conflict-free template period exists within this recommended window. Consider an earlier start or review workload and deadline constraints.' };
}
