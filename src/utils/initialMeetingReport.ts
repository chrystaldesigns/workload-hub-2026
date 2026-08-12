import { CourseDevelopment, InitialMeetingFormData } from "../types";
import { parseDate } from "./calendarEngine";

export const multimediaLabels = {
  vr: "VR: Virtual reality to enhance student understanding of complex subjects.",
  ar: "AR: Augmented reality to enhance student understanding of complex subjects.",
  pollsGames: "Polls or Games: Interactive elements such as polls or games.",
  ai: "AI: Activities that teach responsible and appropriate uses of AI in the classroom.",
  images: "Images: Custom instructional images such as infographics, content-specific illustrations, drawings, or photorealistic images.",
  videos: "Videos: Custom videos. These require additional preparation and production time, so early planning with Multimedia is essential.",
  otherLearningActivities: "Other Learning Activities: Activities selected according to the learning needs of the course.",
} as const;

export const instructionalMaterialLabels = {
  ai: "AI: A program or course AI policy page with assessment-specific AI expectations.",
  canvasPages: "Canvas Pages: Content that fills gaps, elaborates on complex information, emphasizes important concepts, or introduces new information.",
  textbook: "Textbook",
  fscjMaterials: "FSCJ LLC Textbook or Materials",
  thirdPartyPlatform: "Third-Party Platform",
  software: "Software",
  otherOer: "Other Instructional Materials (OER)",
  learningActivities: "Learning Activities",
  proctoredExam: "Proctored Exam",
  videos: "Videos",
} as const;

export const assignmentLabels = {
  discussions: "Discussions",
  exams: "Exams",
  tests: "Tests",
  quizzes: "Quizzes",
  thirdPartyActivities: "Third-Party Activities",
  apaTraining: "APA Training and Assignments",
  writtenAssignments: "Written Assignments",
  courseProject: "Course Project",
  presentations: "Presentation(s)",
  libGuide: "Program/Course LibGuide",
} as const;

export const otherLearningActivityOptions = [
  "Branching Scenario", "Quiz (Question Set)", "Drag and Drop", "Drag the Words", "Interactive Book",
  "Page", "Accordion", "Dialog Cards", "Multiple Choice", "Fill in the Blanks", "Collage",
  "Arithmetic Quiz", "Chart", "Course Presentation", "Documentation Tool", "Guess the Answer",
  "Interactive Video", "Mark the Words", "Memory Game", "Single Choice Set", "Summary",
  "True/False Question", "Image Hotspots", "Audio", "Audio Recorder", "Flashcards", "Image Slider",
  "Essay", "Virtual Tour (360)", "KewAr Code", "Crossword", "Sort the Paragraphs",
  "Multimedia Choice", "Cornell Notes", "Structure Strip", "Game Map", "Word Cloud", "Emoji Cloud",
  "Multipoll", "The Chase",
];

export const integrationTypeLabels = [
  "Passthrough to Platform: The Canvas course includes only essential content. All readings, resources, activities, assessments, and grading occur on the third-party platform; instructors manually enter grades in Canvas.",
  "Direct Links with No Integration: Direct links lead to platform activities and assessments; instructors manually enter grades in Canvas.",
  "Deep Integration with Automatic Grade Sync: Links lead to specific platform resources and completed assessment grades automatically appear in Canvas.",
  "Deep Integration with Manual Grade Entry: Links lead to specific platform resources; instructors manually enter completed assessment grades in Canvas.",
  "Integration Requires Instructor Pairing: Instructors connect their individual Canvas course sections to the third-party platform course.",
];

const emptyChoice = () => ({ selected: false, notes: "" });

export const createEmptyInitialMeetingForm = (): InitialMeetingFormData => ({
  savedAt: "",
  courseOfferings: "",
  curriculumStatus: "",
  curriculumNotes: "",
  multimedia: {
    vr: emptyChoice(), ar: emptyChoice(), pollsGames: emptyChoice(), ai: emptyChoice(),
    images: emptyChoice(), videos: emptyChoice(), otherLearningActivities: emptyChoice(),
  },
  otherLearningActivityOptions: [],
  instructionalMaterials: {
    ai: emptyChoice(), canvasPages: emptyChoice(), textbook: emptyChoice(), fscjMaterials: emptyChoice(),
    thirdPartyPlatform: emptyChoice(), software: emptyChoice(), otherOer: emptyChoice(),
    learningActivities: emptyChoice(), proctoredExam: emptyChoice(), videos: emptyChoice(),
  },
  textbook: { title: "", edition: "", author: "", publisher: "", year: "", isbn13: "", costDesignation: "" },
  numberOfModules: "",
  assignmentsEnabled: false,
  assignments: {
    discussions: false, exams: false, tests: false, quizzes: false, thirdPartyActivities: false,
    apaTraining: false, writtenAssignments: false, courseProject: false, presentations: false, libGuide: false,
  },
  courseProjectScaffolded: false,
  meetingPreference: "",
  preferredMeetingDay: "",
  preferredMeetingTime: "",
  preferredMeetingPeriod: "AM",
  weeklyStatusUpdates: false,
  calendarReminders: "",
  thirdPartyApplies: false,
  thirdPartyName: "",
  smeExperience: "",
  thirdPartyDevelopmentRequired: false,
  thirdPartyDevelopmentDate: "",
  permissionsRequest: "",
  permissionsNotes: "",
  collegeCostApplies: false,
  collegeCostNotes: "",
  collegeCostApproval: "",
  studentCostApplies: false,
  studentCostNotes: "",
  integrationTypes: [],
});

const formatDate = (value?: string) => {
  if (!value) return "TBD";
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}-${day}-${date.getFullYear()}`;
};

const section = (title: string, lines: string[]) => lines.length ? `${title}\n\n${lines.join("\n")}` : "";
const selectedChoiceLines = <T extends Record<string, { selected: boolean; notes: string }>>(
  choices: T,
  labels: Record<keyof T, string>
) => Object.entries(choices).flatMap(([key, choice]) => {
  if (!choice.selected) return [];
  return [`• ${labels[key as keyof T]}`, ...(choice.notes.trim() ? [`  Notes: ${choice.notes.trim()}`] : [])];
});

export function generateInitialMeetingReport(
  course: CourseDevelopment,
  data: InitialMeetingFormData,
  projectedCloseout: string
) {
  const smeName = course.deptTeam.smeName?.trim() || "Subject Matter Expert";
  const lastName = smeName.split(/\s+/).filter(Boolean).at(-1) || "SME";
  const sections: string[] = [];

  const courseInfo = [
    course.program && `Program Title: ${course.program}`,
    (course.courseNumber || course.courseTitle) && `Course: ${course.courseNumber}${course.courseTitle ? `: ${course.courseTitle}` : ""}`,
    "Instructional Designer: Chrystal Wickline, wickline@fscj.edu",
    (course.deptTeam.smeName || course.deptTeam.smeEmail) && `Subject Matter Expert: ${course.deptTeam.smeName || ""}${course.deptTeam.smeEmail ? `, ${course.deptTeam.smeEmail}` : ""}`,
    course.devType && `Course Development Type: ${course.devType}`,
    projectedCloseout && `Projected Course Development Close-out: ${formatDate(projectedCloseout)}`,
    data.courseOfferings.trim() && `Course Offerings: ${data.courseOfferings.trim()}`,
    course.workshopCourse && `Workshop Course: ${course.workshopCourse}`,
  ].filter(Boolean) as string[];
  sections.push(section("COURSE DEVELOPMENT INFORMATION", courseInfo));

  const curriculum: string[] = [];
  if (data.curriculumStatus) {
    curriculum.push(`The Program Learning Outcomes (PLOs), Course Learning Outcomes (CLOs), prerequisites, and corequisites ${data.curriculumStatus === "current" ? "are" : "are not"} current.`);
  }
  if (data.curriculumNotes.trim()) curriculum.push(`Notes: ${data.curriculumNotes.trim()}`);
  sections.push(section("COLLEGE CURRICULUM OUTLINE", curriculum));

  const multimedia = selectedChoiceLines(data.multimedia, multimediaLabels);
  if (data.multimedia.otherLearningActivities.selected && data.otherLearningActivityOptions.length) {
    multimedia.push(...data.otherLearningActivityOptions.map((item) => `  • ${item}`));
  }
  sections.push(section("MULTIMEDIA PRODUCTION", multimedia));

  const materials = selectedChoiceLines(data.instructionalMaterials, instructionalMaterialLabels);
  if (data.instructionalMaterials.textbook.selected) {
    const textbookFields = [
      ["Title", data.textbook.title], ["Edition", data.textbook.edition], ["Author", data.textbook.author],
      ["Publisher", data.textbook.publisher], ["Year", data.textbook.year], ["ISBN-13", data.textbook.isbn13],
    ];
    materials.push(...textbookFields.filter(([, value]) => value.trim()).map(([label, value]) => `  ${label}: ${value.trim()}`));
    if (data.textbook.costDesignation) materials.push(`  ${data.textbook.costDesignation === "purchaseRequired" ? "Purchase Required" : "Zero Textbook Cost (ZTC)"}`);
  }
  sections.push(section("INSTRUCTIONAL MATERIALS", materials));

  const design: string[] = [];
  if (data.numberOfModules.trim()) design.push(`This course will consist of ${data.numberOfModules.trim()} modules.`);
  if (data.assignmentsEnabled) {
    design.push(...Object.entries(data.assignments).filter(([, selected]) => selected).map(([key]) => `• ${assignmentLabels[key as keyof typeof assignmentLabels]}`));
    if (data.assignments.courseProject && data.courseProjectScaffolded) {
      design.push("  • The Course Project includes scaffolded parts, such as Project 1.1 and Project 1.2, that culminate in the final project.");
    }
  }
  sections.push(section("DESIGN AND PLAN", design));

  const collaboration: string[] = [];
  if (data.meetingPreference === "weekly") {
    const timing = [data.preferredMeetingDay.trim(), data.preferredMeetingTime.trim() && `at ${data.preferredMeetingTime.trim()} ${data.preferredMeetingPeriod}`].filter(Boolean).join(" ");
    collaboration.push(`Professor ${lastName} prefers weekly one-on-one meetings${timing ? ` on ${timing}` : ""}.`);
  } else if (data.meetingPreference === "adHoc") {
    collaboration.push(`Professor ${lastName} prefers to meet ad hoc as needed.`);
  }
  if (data.weeklyStatusUpdates) collaboration.push("Chrystal sends weekly project status updates by email to the Content Developer, Dean, and/or Program Manager. The weekly status update identifies what is complete, what is in CeL’s QA queue, what is in progress by the Content Developer, what is in progress by the Instructional Designer, and any relevant notes.");
  if (data.calendarReminders) collaboration.push(`Professor ${lastName} has ${data.calendarReminders === "optedIn" ? "opted to receive" : "opted out of receiving"} calendar reminders for content due to the Instructional Designer.`);
  sections.push(section("COLLABORATION AND COMMUNICATION", collaboration));

  if (data.thirdPartyApplies) {
    const thirdParty: string[] = [];
    if (data.thirdPartyName.trim()) thirdParty.push(`Publisher and Platform Name: ${data.thirdPartyName.trim()}`);
    const experience = { none: "No Experience — Will Need ID Assistance", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
    if (data.smeExperience) thirdParty.push(`SME Experience Level: ${experience[data.smeExperience]}`);
    if (data.thirdPartyDevelopmentRequired) thirdParty.push(`${smeName} will have the third-party platform, tool, or software ready, share the course ID, and provide the key to the Instructional Designer by ${formatDate(data.thirdPartyDevelopmentDate)}.`);
    if (data.permissionsRequest) {
      thirdParty.push(`IT Request Submitted: ${data.permissionsRequest === "yes" ? "Yes" : data.permissionsRequest === "no" ? "No" : "Not Applicable"}.`);
      if (data.permissionsRequest === "yes") thirdParty.push("Please share the report from IT with the Instructional Designer.");
    }
    if (data.permissionsNotes.trim()) thirdParty.push(`IT Request Notes: ${data.permissionsNotes.trim()}`);
    if (data.collegeCostApplies) {
      if (data.collegeCostNotes.trim()) thirdParty.push(`College or Department Cost: ${data.collegeCostNotes.trim()}`);
      if (data.collegeCostApproval === "yes" || data.collegeCostApproval === "no") thirdParty.push(`The cost ${data.collegeCostApproval === "yes" ? "has" : "has not"} been discussed with the budget administrator and/or Department Dean and has gone through IT approval, if applicable.`);
      if (data.collegeCostApproval === "na") thirdParty.push("Cost discussion and IT approval: Not Applicable.");
    }
    if (data.studentCostApplies && data.studentCostNotes.trim()) thirdParty.push(`Student Cost: ${data.studentCostNotes.trim()}`);
    thirdParty.push(...data.integrationTypes.map((item) => `• ${item}`));
    sections.push(section("THIRD-PARTY INFORMATION", thirdParty));
  }

  return sections.filter(Boolean).join("\n\n");
}
