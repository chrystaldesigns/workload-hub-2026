import React from 'react';
import { CourseMaterialsFormData } from '../utils/courseMaterials';

export function CourseMaterialsFields({ values, onChange, required = true, namePrefix }: {
  values: CourseMaterialsFormData;
  onChange: (values: CourseMaterialsFormData) => void;
  required?: boolean;
  namePrefix: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 text-xs md:col-span-2">
      <fieldset className="space-y-2">
        <legend className="text-[10px] font-semibold uppercase text-slate-500">Third-Party Platform(s)</legend>
        <div className="flex flex-wrap gap-4">
          {(['yes', 'no'] as const).map((answer) => (
            <label key={answer} className="inline-flex items-center gap-2">
              <input type="radio" name={`${namePrefix}-third-party-platform`} value={answer}
                checked={values.usesThirdPartyPlatform === answer} required={required}
                onChange={() => onChange({ ...values, usesThirdPartyPlatform: answer })}
                className="h-3.5 w-3.5 accent-[#006282]" />
              {answer === 'yes' ? 'Yes' : 'No'}
            </label>
          ))}
        </div>
        {values.usesThirdPartyPlatform === 'yes' && (
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase text-slate-500">Name of Third-Party Platform(s)</span>
            <input type="text" name={`${namePrefix}-third-party-platform-names`} value={values.thirdPartyPlatformNames}
              onChange={(event) => onChange({ ...values, thirdPartyPlatformNames: event.target.value })}
              required placeholder="Enter third-party platform name(s)"
              className="w-full border border-slate-300 bg-white px-3 py-2 text-xs" />
          </label>
        )}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-[10px] font-semibold uppercase text-slate-500">Instructional Materials</legend>
        <div className="flex flex-wrap gap-4">
          {(['ZTC', 'Textbook', 'OER'] as const).map((option) => (
            <label key={option} className="inline-flex items-center gap-2">
              <input type="radio" name={`${namePrefix}-instructional-materials`} value={option}
                checked={values.instructionalMaterials === option} required={required}
                onChange={() => onChange({ ...values, instructionalMaterials: option })}
                className="h-3.5 w-3.5 accent-[#006282]" />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
