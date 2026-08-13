export type ItemType = "courseDevelopment" | "project" | "standaloneTask";

export type AlertStatus =
  | "No Concerns"
  | "Potential Concerns"
  | "High Priority Concerns";

export type Priority = "Low" | "Moderate" | "High" | "Critical";

export type WorkStatus =
  | "Not Started"
  | "Projected"
  | "In Progress"
  | "Developing (Content)"
  | "Developing (Canvas)"
  | "Complete"
  | "Not Applicable"
  | "Submission Late (SME)"
  | "Scheduled"
  | "On Hold"
  | "Overdue"
  | "Blocked";

export type RoleOwner =
  | "Operations"
  | "Instructional Designer"
  | "Subject Matter Expert"
  | "Quality Assurance"
  | "Multimedia"
  | "Learning Experience Architect"
  | "ID"
  | "SME"
  | "QA";

export type ActionType =
  | "email"
  | "calendar"
  | "database"
  | "clipboard"
  | "none";

export type DevelopmentType =
  | "Original (New) Development"
  | "Original"
  | "New Release"
  | "Tier 1 & 2 Revision"
  | "Modification";

export type TermRelease =
  | "Spring A"
  | "Spring B"
  | "Spring C"
  | "Summer A"
  | "Summer B"
  | "Summer C"
  | "Fall A"
  | "Fall B"
  | "Fall C";

export interface CelTeam {
  golf: string;
  chrystal: string;
  admin: string;
  golfEmail?: string;
  chrystalEmail?: string;
  adminEmail?: string;
  krisName?: string;
  krisEmail?: string;
  bobName?: string;
  bobEmail?: string;
  christinaName?: string;
  christinaEmail?: string;
  ansaName?: string;
  ansaEmail?: string;
}

export interface DeptTeam {
  smeName: string;
  smeEmail: string;
  deanName: string;
  deanEmail: string;
  associateDeanName?: string;
  associateDeanEmail?: string;
  managerName?: string;
  managerEmail?: string;
}

export interface TaskActionTemplate {
  actionType: ActionType;
  label?: string;
  subject?: string;
  to?: string[];
  cc?: string[];
  optional?: string[];
  body?: string;
  attachmentReminder?: string[];
  copyText?: string;
  outlookType?: "email" | "calendar";
  calendarShowAs?: "free" | "tentative" | "busy" | "oof" | "workingElsewhere";
  calendarAllDay?: boolean;
  calendarDurationMinutes?: number;
}

export interface CourseDevelopmentTask {
  id: number | string;
  itemType?: "courseDevelopmentTask";

  phase: string;
  name: string;

  assignedTo: RoleOwner;
  roleOwner?: RoleOwner;

  status: WorkStatus;

  startDate?: string;
  dueDate?: string;
  completionDate?: string;

  autoStartDate?: string | null;
  manualStartDate?: string | null;
  effectiveStartDate?: string | null;

  autoDueDate?: string | null;
  manualDueDate?: string | null;
  effectiveDueDate?: string | null;

  autoDuration?: number | null;
  manualDuration?: number | null;
  effectiveDuration?: number | null;

  durationDays?: number;
  durationMinutes?: number;

  notes?: string;

  isMilestone?: boolean;
  scheduledMeetingTime24?: string;
  scheduledMeetingTimeDisplay?: string;

  dependencyIds?: Array<number | string>;
  predecessorIds?: Array<number | string>;
  canOverlap?: boolean;

  actionType?: ActionType;
  actionTemplate?: TaskActionTemplate;
  quickBaseCopyText?: string;
  protectedPlaceholders?: boolean;

  isGenerated?: boolean;
  isManualOverride?: boolean;
}

export interface CourseMilestones {
  compensationStart?: string | null;
  compensationEnd?: string | null;
  onboarding?: string | null;
  initialMeeting?: string | null;
  courseDesignPlanDue?: string | null;
  kickoff?: string | null;
  midpointReview?: string | null;
  finalReview?: string | null;
  smeDeliverablesComplete?: string | null;
  developmentCompletion?: string | null;
  closeout?: string | null;
}

export interface InitialMeetingChoice {
  selected: boolean;
  notes: string;
}

export interface InitialMeetingFormData {
  savedAt: string;
  courseOfferings: string;
  curriculumStatus: "current" | "notCurrent" | "";
  curriculumNotes: string;
  multimedia: Record<
    "vr" | "ar" | "pollsGames" | "ai" | "images" | "videos" | "otherLearningActivities",
    InitialMeetingChoice
  >;
  otherLearningActivityOptions: string[];
  instructionalMaterials: Record<
    "ai" | "canvasPages" | "textbook" | "fscjMaterials" | "thirdPartyPlatform" | "software" |
    "otherOer" | "learningActivities" | "proctoredExam" | "videos",
    InitialMeetingChoice
  >;
  textbook: {
    title: string;
    edition: string;
    author: string;
    publisher: string;
    year: string;
    isbn13: string;
    costDesignation: "purchaseRequired" | "ztc" | "";
  };
  numberOfModules: string;
  assignmentsEnabled: boolean;
  assignments: Record<
    "discussions" | "exams" | "tests" | "quizzes" | "thirdPartyActivities" | "apaTraining" |
    "writtenAssignments" | "courseProject" | "presentations" | "libGuide",
    boolean
  >;
  courseProjectScaffolded: boolean;
  meetingPreference: "weekly" | "adHoc" | "";
  preferredMeetingDay: string;
  preferredMeetingTime: string;
  preferredMeetingPeriod: "AM" | "PM";
  weeklyStatusUpdates: boolean;
  calendarReminders: "optedIn" | "optedOut" | "";
  thirdPartyApplies: boolean;
  thirdPartyName: string;
  smeExperience: "none" | "beginner" | "intermediate" | "advanced" | "";
  thirdPartyDevelopmentRequired: boolean;
  thirdPartyDevelopmentDate: string;
  permissionsRequest: "yes" | "no" | "na" | "";
  permissionsNotes: string;
  collegeCostApplies: boolean;
  collegeCostNotes: string;
  collegeCostApproval: "yes" | "no" | "na" | "";
  studentCostApplies: boolean;
  studentCostNotes: string;
  integrationTypes: string[];
}

export interface CourseDevelopment {
  id?: string;
  itemType?: "courseDevelopment";
  archived?: boolean;
  archivedDate?: string;

  program: string;
  courseNumber: string;
  courseTitle: string;

  canvasVersion: string;
  workshopCourse: string;

  devType: DevelopmentType;
  developmentType?: DevelopmentType;

  versionNumber: number | string;

  termRelease: TermRelease;
  termDeadline: string;

  calculatedDeadline?: string;
  completionDate?: string;

  devStagger: number;
  onboarding: boolean;

  celTeam: CelTeam;
  deptTeam: DeptTeam;

  alertStatus: AlertStatus;
  courseNotes?: string;

  hideCompletedTasks: boolean;

  milestones?: CourseMilestones;
  initialMeetingForm?: InitialMeetingFormData;
  tasks: CourseDevelopmentTask[];

  initialized?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LssTask {
  id: string;
  itemType?: "projectTask";

  name: string;
  assignedTo: string;

  startDate?: string;
  dueDate: string;
  completionDate?: string;

  manualStartDate?: string | null;
  manualDueDate?: string | null;
  manualDuration?: number | null;

  durationMinutes?: number;
  durationDays?: number;

  status: "Pending" | "Completed" | WorkStatus;
  notes?: string;

  actionType?: ActionType;
  actionTemplate?: TaskActionTemplate;
}

export interface LssProject {
  id?: string;
  itemType?: "project";
  archived?: boolean;
  archivedDate?: string;

  title: string;
  type: string;

  priority: Priority;
  alertStatus?: AlertStatus;

  startDate: string;
  targetCompletionDate?: string;
  completionDate?: string;

  manualStartDate?: string | null;
  manualDueDate?: string | null;
  manualDuration?: number | null;

  status: "Not Started" | "On Hold" | "In Progress" | "Complete";

  projectLead: string;
  processOwner?: string;
  projectChampion?: string;
  stakeholders?: string;

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

  notes?: string;
  tasks: LssTask[];

  createdAt?: string;
  updatedAt?: string;
}

export interface StandaloneTask {
  id?: string;
  itemType?: "standaloneTask";
  archived?: boolean;
  archivedDate?: string;

  title: string;

  startDate?: string;
  dueDate?: string;
  completionDate?: string;

  manualStartDate?: string | null;
  manualDueDate?: string | null;
  manualDuration?: number | null;

  durationMinutes?: number;
  durationDays?: number;

  notes?: string;

  status: "Not Started" | "In Progress" | "Complete" | "On Hold" | "Overdue";
  progress: number;

  priority: Priority;
  alertStatus?: AlertStatus;

  actionType?: ActionType;
  actionTemplate?: TaskActionTemplate;

  createdAt?: string;
  updatedAt?: string;
}

export interface OutlookEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  showAs: "free" | "tentative" | "busy" | "oof" | "workingElsewhere";
  isAllDay?: boolean;
}

export interface CalendarSettings {
  customBlocked: string[];
  outlookConnected?: boolean;
  outlookEmail?: string;
  timezone?: "America/New_York";
}
