export interface CelTeam {
  golf: string;
  chrystal: string;
  admin: string;
}

export interface DeptTeam {
  smeName: string;
  smeEmail: string;
  deanName: string;
  deanEmail: string;
  managerName?: string;
  managerEmail?: string;
}

export interface CourseDevelopmentTask {
  id: number;
  phase: string;
  name: string;
  assignedTo: "Operations" | "Instructional Designer" | "Subject Matter Expert" | "Quality Assurance" | "Multimedia" | "Learning Experience Architect";
  status: "Not Started" | "In Progress" | "Developing (Content)" | "Developing (Canvas)" | "Complete" | "Not Applicable" | "Submission Late (SME)" | "Scheduled" | "On Hold";
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  durationDays: number;
}

export interface CourseDevelopment {
  id?: string;
  program: string;
  courseNumber: string;
  courseTitle: string;
  canvasVersion: string;
  workshopCourse: string;
  devType: "Original" | "New Release" | "Tier 1 & 2 Revision" | "Modification";
  versionNumber: number;
  termRelease: "Spring A" | "Spring B" | "Spring C" | "Summer A" | "Summer B" | "Summer C" | "Fall A" | "Fall B" | "Fall C";
  termDeadline: string; // YYYY-MM-DD
  devStagger: number; // minimum spacing in calendar days
  onboarding: boolean; // Yes = Onboarding tasks active, No = Excluded (N/A)
  celTeam: CelTeam;
  deptTeam: DeptTeam;
  alertStatus: "No Concerns" | "Potential Concerns" | "High Priority Concerns";
  courseNotes?: string;
  hideCompletedTasks: boolean;
  tasks: CourseDevelopmentTask[];
}

export interface LssTask {
  id: string;
  name: string;
  assignedTo: string;
  dueDate: string; // YYYY-MM-DD
  status: "Pending" | "Completed";
}

export interface LssProject {
  id?: string;
  title: string;
  type: string; // "DMAIC" | "Green Belt" | "Black Belt" | "Yellow Belt"
  priority: "Low" | "Moderate" | "High" | "Critical";
  startDate: string; // YYYY-MM-DD
  targetCompletionDate?: string; // YYYY-MM-DD
  status: "Not Started" | "On Hold" | "In Progress" | "Complete";
  projectLead: string;
  processOwner?: string;
  projectChampion?: string;
  stakeholders?: string;
  // Lean Six Sigma Charter Fields
  problemStatement: string;
  businessCaseAndBenefits: string;
  inScope: string;
  outOfScope: string;
  performanceMetrics: string;
  risks: string;
  voiceOfCustomer: string;
  customerComment?: string;
  issue?: string;
  customerRequirement?: string;
  objectiveMeasure?: string;
  operationalDefinition?: string;
  // Timeline phases
  timelineMethodology: "Kaizen" | "Lean" | "Six Sigma";
  defineDuration?: number;
  defineProjectedCompletion?: string;
  measureDuration?: number;
  measureProjectedCompletion?: string;
  analyzeDuration?: number;
  analyzeProjectedCompletion?: string;
  improveDuration?: number;
  improveProjectedCompletion?: string;
  controlDuration?: number;
  controlProjectedCompletion?: string;
  gateReviewDates?: string;
  estimatedDuration?: number;
  timelineNotes?: string;
  tasks: LssTask[];
}

export interface StandaloneTask {
  id?: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  notes?: string;
  status: "Not Started" | "In Progress" | "Complete" | "On Hold";
  progress: number; // 0%, 50%, 100%
  priority: "Low" | "Moderate" | "High" | "Critical";
}

export interface OutlookEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  showAs: "free" | "tentative" | "busy" | "oof" | "workingElsewhere";
}

export interface CalendarSettings {
  customBlocked: string[]; // YYYY-MM-DD strings
  outlookConnected?: boolean;
  outlookEmail?: string;
}
