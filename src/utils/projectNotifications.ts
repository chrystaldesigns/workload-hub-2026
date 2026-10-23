import { CourseDevelopment } from '../types';
import { courseMaterialsStatements } from './courseMaterials';

export function buildVersionInformation(course: CourseDevelopment, now = new Date()): string {
  const currentMonthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const canvasVersion = course.canvasVersion || '[canvas version]';
  const developmentType = course.devType || '[development type]';
  const smeName = (course.deptTeam.smeName || '').trim() || 'SME';
  return `VERSION INFORMATION

Date: ${currentMonthYear}
Version Number: ${canvasVersion}
Action: ${developmentType}
Details: This course was designed and developed by the Subject Matter Expert, ${smeName}, and Instructional Designer, Chrystal Wickline`;
}

export function buildProjectCompletionNotification(course: CourseDevelopment, now = new Date()): string {
  const statements = courseMaterialsStatements(course);
  const hour = now.getHours();
  const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const smeName = (course.deptTeam.smeName || "").trim() || "SME";
  const smeNameParts = smeName.split(/\s+/).filter(Boolean);
  const smeLastName = smeNameParts[smeNameParts.length - 1] || "SME";

  const to = [
    course.deptTeam.smeEmail,
    course.deptTeam.deanEmail,
    course.deptTeam.associateDeanEmail,
    "Ansa.Reams.Johnson@fscj.edu",
    "martha.mcnulty@fscj.edu",
  ].filter(Boolean).join("; ");

  const cc = [
    "kris.kristen@fscj.edu",
    "bob.dee@fscj.edu",
    "Golf.K@fscj.edu",
    "christina.perrin@fscj.edu",
  ].join("; ");

  return `TO: ${to}
Cc: ${cc}
SUBJECT: ${course.courseNumber} Course Completion & Next Steps

LINK TO: Learning Plan (https://cel.quickbase.com/nav/app/bs3dcdkm5/table/bs3dcdktv/action/q?qid=155&NavFrom=Recents&navfrom=Recents&skip=230)
ATTACHMENT: Outcomes Map

Good ${greetingTime},

FSCJ ONLINE

- The course [development is / modifications re] complete.
- The code check and archiving processes are complete.
- The course is the ‘Staging’ account and is ready for Anšá to move to ‘Production.’

SUBJECT MATTER EXPERT

Professor ${smeLastName},

Class Number

Please contact our Director of E-Admin & Support Services, Dr. Anšá Reams-Johnson, and provide your class number so we can load the course content. FSCJ Online Support Services will load the course content into your class so you can begin personalizing your course.

Errors and Modifications

If you see any errors that need immediate attention, please contact us via CeL@fscj.edu. You can start a note for any course modifications you make and share it with us at the end of the term. That process will allow us to update our course before loading the content for your next class. Please send any requests you have to CeL@fscj.edu.

Future Classes Beyond This Term

Important Note: For each new term, it is highly recommended that you contact our Director of E-Admin & Support Services, Dr. Anšá Reams-Johnson, to load your classes. This ensures that any changes to Canvas or the CeL-developed course are incorporated. From there, you should be able to transfer your course customization from a previous class, such as adding readings or the like.

Stipend Inquiries

If you have any questions regarding your stipend, please don’t hesitate to contact Kris Kristen directly.

DIRECTOR, E-ADMIN & SUPPORT SERVICES

Anšá,

Please load the content for Professor ${smeLastName}’s class when you have a moment.

- ${statements.platform}
- ${statements.materials}
- The Learning Grading Plan is linked
- The Outcomes Map is attached for your convenience.`;
}
