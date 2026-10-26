import type { CourseDevelopment } from '../types';
import type { TermPlanningSettings } from './termPlanning';
import { validISODate } from './termPlanning';
import { planningRows } from './planningRows';

// Filter only after calculating: active projects remain workload constraints.
export function proposedPlanningRows(courses: CourseDevelopment[], settings?: TermPlanningSettings, customBlocked: string[] = []) {
  return planningRows(courses, settings, customBlocked).filter(row => row.status === 'Proposed');
}

export function selectProposalStart(settings: TermPlanningSettings, proposalId: string, date: string): TermPlanningSettings {
  if (!validISODate(date)) throw new Error('Choose a valid project start date.');
  const proposal = settings.proposals?.find(item => item.id === proposalId && !item.convertedProjectId);
  if (!proposal) throw new Error('This proposal is no longer available. Refresh planning and try again.');
  return { ...settings, proposals: settings.proposals!.map(item => item.id === proposalId ? { ...item, projectStartDate: date } : item) };
}
