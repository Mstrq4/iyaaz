import type { ChangeEvent } from 'react';

import { isAttachmentRequirement } from '../../lib/prompt/assemble';
import type { PromptFieldDescriptor } from '../../lib/prompt/schema';
import { IyaazIcon } from '../icons/IyaazIcon';

interface PromptFieldProps {
  field: PromptFieldDescriptor;
  displayLabel: string;
  value: string;
  invalid: boolean;
  selectPlaceholder: string;
  booleanYes: string;
  booleanNo: string;
  requiredMessage: string;
  assetReminder: string;
  onChange: (value: string) => void;
}

export function PromptField({
  field,
  displayLabel,
  value,
  invalid,
  selectPlaceholder,
  booleanYes,
  booleanNo,
  requiredMessage,
  assetReminder,
  onChange,
}: PromptFieldProps) {
  if (isAttachmentRequirement(field.sourceFragment)) {
    return (
      <div className="prompt-builder__field" data-prompt-field>
        <div className="prompt-builder__asset" data-asset-reminder>
          <IyaazIcon name="info" />
          <span><strong>{displayLabel}</strong> — {assetReminder}</span>
        </div>
      </div>
    );
  }

  const id = `prompt-field-${field.id}`;
  const common = {
    id,
    'data-prompt-control': true,
    'aria-required': field.required,
    'aria-invalid': invalid || undefined,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value),
  } as const;

  let control;
  if (field.kind === 'textarea') {
    control = <textarea {...common} rows={4} />;
  } else if (field.kind === 'select') {
    control = (
      <select {...common}>
        <option value="">{selectPlaceholder}</option>
        {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  } else if (field.kind === 'boolean') {
    control = (
      <select {...common}>
        <option value="">{selectPlaceholder}</option>
        <option value="yes">{booleanYes}</option>
        <option value="no">{booleanNo}</option>
      </select>
    );
  } else {
    control = <input {...common} type="text" />;
  }

  return (
    <div className="prompt-builder__field" data-prompt-field>
      <label htmlFor={id}>{displayLabel}</label>
      {control}
      {invalid ? <span className="prompt-builder__field-error">{requiredMessage}</span> : null}
    </div>
  );
}
