import { CourseDevelopment } from '../types';

export type CourseMaterialsFormData = {
  usesThirdPartyPlatform: '' | 'yes' | 'no';
  thirdPartyPlatformNames: string;
  instructionalMaterials: '' | NonNullable<CourseDevelopment['instructionalMaterials']>;
};

export function courseMaterialsFormValues(course: Partial<CourseDevelopment> = {}): CourseMaterialsFormData {
  return {
    usesThirdPartyPlatform: course.usesThirdPartyPlatform === true ? 'yes' : course.usesThirdPartyPlatform === false ? 'no' : '',
    thirdPartyPlatformNames: typeof course.thirdPartyPlatformNames === 'string' ? course.thirdPartyPlatformNames : '',
    instructionalMaterials: ['ZTC', 'Textbook', 'OER'].includes(course.instructionalMaterials || '') ? course.instructionalMaterials! : '',
  };
}

export function courseMaterialsValidation(values: CourseMaterialsFormData, requireSelections = true): string {
  if (requireSelections && !['yes', 'no'].includes(values.usesThirdPartyPlatform)) return 'Select Yes or No for Third-Party Platform(s).';
  if (values.usesThirdPartyPlatform === 'yes' && !values.thirdPartyPlatformNames.trim()) return 'Enter the Name of Third-Party Platform(s).';
  if ((requireSelections || values.instructionalMaterials) && !['ZTC', 'Textbook', 'OER'].includes(values.instructionalMaterials)) return 'Select Instructional Materials: ZTC, Textbook, or OER.';
  return '';
}

// Omit unanswered fields when editing legacy records instead of inventing
// defaults. Choosing No explicitly clears the names saved for a former Yes.
export function courseMaterialsFields(values: CourseMaterialsFormData): Partial<CourseDevelopment> {
  return {
    ...(values.usesThirdPartyPlatform ? {
      usesThirdPartyPlatform: values.usesThirdPartyPlatform === 'yes',
      thirdPartyPlatformNames: values.usesThirdPartyPlatform === 'yes' ? values.thirdPartyPlatformNames.trim() : '',
    } : {}),
    ...(values.instructionalMaterials ? { instructionalMaterials: values.instructionalMaterials } : {}),
  };
}

export function courseMaterialsStatements(course: CourseDevelopment) {
  const values = courseMaterialsFormValues(course);
  const error = courseMaterialsValidation(values);
  if (error) throw new Error(error);
  return {
    platform: values.usesThirdPartyPlatform === 'yes'
      ? `This course does use a 3rd-party platform: ${values.thirdPartyPlatformNames.trim().replace(/\.+$/, '')}.`
      : 'This course does not use a 3rd-party platform.',
    materials: { ZTC: 'This course is ZTC.', Textbook: 'This course uses a Textbook.', OER: 'This course uses OER.' }[values.instructionalMaterials as 'ZTC' | 'Textbook' | 'OER'],
  };
}

// Creation requires explicit answers; updates must still accept legacy records
// that have never supplied these optional fields.
export function validateSavedCourseMaterials(course: Partial<CourseDevelopment>, requireSelections = false): string {
  if (course.usesThirdPartyPlatform !== undefined && typeof course.usesThirdPartyPlatform !== 'boolean') return 'Select Yes or No for Third-Party Platform(s).';
  if (course.thirdPartyPlatformNames !== undefined && typeof course.thirdPartyPlatformNames !== 'string') return 'Enter the Name of Third-Party Platform(s).';
  if (course.instructionalMaterials !== undefined && !['ZTC', 'Textbook', 'OER'].includes(course.instructionalMaterials)) return 'Select Instructional Materials: ZTC, Textbook, or OER.';
  return courseMaterialsValidation(courseMaterialsFormValues(course), requireSelections);
}
