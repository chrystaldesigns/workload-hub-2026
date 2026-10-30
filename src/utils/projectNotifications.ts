import { CourseDevelopment } from '../types';
import { courseMaterialsFormValues } from './courseMaterials';

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
  // Notification drafts remain available before required course fields are complete.
  const values = courseMaterialsFormValues(course);
  const platformNames = values.thirdPartyPlatformNames.trim();
  // A pasted email is not a platform name. Reject it before interpolation rather
  // than attempting to extract names that may belong to a different course.
  const containsEmailContent = /\b(?:TO|CC|SUBJECT|ATTACHMENT|LINK TO):|\bFSCJ ONLINE\b|\bSUBJECT MATTER EXPERT\b|\bDIRECTOR, E-ADMIN & SUPPORT SERVICES\b/i.test(platformNames);
  const platformInformation = !platformNames
    ? '[Third-party platform information not provided]'
    : containsEmailContent
      ? '[Third-party platform information needs review]'
      : platformNames.replace(/\s+/g, ' ').replace(/\.+$/, '');
  const completionStatement = course.devType === 'Tier 1 & 2 Revision' || course.devType === 'Modification'
    ? 'The course modifications are complete.'
    : ['Original (New) Development', 'Original', 'New Release'].includes(course.devType)
      ? 'The course development is complete.'
      : 'The course is complete.';
  const statements = {
    platform: values.usesThirdPartyPlatform === 'yes'
      ? containsEmailContent || !platformNames
        ? platformInformation
        : `This course uses the following third-party platforms: ${platformInformation}.`
      : values.usesThirdPartyPlatform === 'no'
        ? 'This course does not use a third-party platform.'
        : '[Third-party platform information not provided]',
    materials: { ZTC: 'This course is ZTC.', Textbook: 'This course uses a Textbook.', OER: 'This course uses OER.' }[values.instructionalMaterials]
      || 'Instructional Materials: [Not provided]',
  };
  const hour = now.getHours();
  const greetingTime = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const smeName = (course.deptTeam?.smeName || "").trim();
  const smeNameParts = smeName.split(/\s+/).filter(Boolean);
  const smeLastName = smeNameParts[smeNameParts.length - 1] || "[Not provided]";

  const to = [
    course.deptTeam?.smeEmail,
    course.deptTeam?.deanEmail,
    course.deptTeam?.associateDeanEmail,
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
SUBJECT: ${course.courseNumber || '[Not provided]'} Course Completion & Next Steps

LINK TO: Learning Plan (https://cel.quickbase.com/nav/app/bs3dcdkm5/table/bs3dcdktv/action/q?qid=155&NavFrom=Recents&navfrom=Recents&skip=230)
ATTACHMENT: Outcomes Map

Good ${greetingTime},

FSCJ ONLINE

- ${completionStatement}
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

Faculty Resources and Next Steps

You can find your Faculty Schedule in myFSCJ (PeopleSoft). Instructions for accessing your schedule are available in the Faculty Exchange.

I recommend visiting the Canvas pages linked below and saving them as favorites in your browser. The Faculty Exchange is a resource hub for adjunct faculty, with useful information that is regularly updated. Full-time faculty may also find these resources helpful.

- View Teaching Schedule: https://canvas.fscj.edu/courses/100662/pages/view-teaching-schedule-and-class-roster?module_item_id=4639710
- Syllabus: https://canvas.fscj.edu/courses/100662/pages/syllabus?module_item_id=4701101
- Term Target Dates: https://canvas.fscj.edu/courses/100662/pages/term-targets?module_item_id=4710811
- CeL Master Courses: https://canvas.fscj.edu/courses/100662/pages/center-for-elearning-master-courses?module_item_id=4634868

This page explains how to submit a request ticket to FSCJ Online to have course content loaded into your teaching sections.

DIRECTOR, E-ADMIN & SUPPORT SERVICES

Anšá,

Please load the content for Professor ${smeLastName}’s class when you have a moment.

- ${statements.platform}
- ${statements.materials}
- The Learning Grading Plan is linked
- The Outcomes Map is attached for your convenience.`;
}
