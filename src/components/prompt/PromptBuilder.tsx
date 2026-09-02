'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import type { Locale } from '../../lib/i18n';
import type { LocalizedLibraryRecord } from '../../lib/library/types';
import { buildPrompt, type PromptOutputLanguage, type PromptTone } from '../../lib/prompt/build';
import { promptBuilderCopy } from '../../lib/prompt/copy';
import type { PromptFieldDefinition, PromptSchema } from '../../lib/prompt/schema';
import { IyaazIcon } from '../icons/IyaazIcon';

interface PromptBuilderProps {
  uiLocale: Locale;
  schema: PromptSchema;
  records: Record<Locale, LocalizedLibraryRecord>;
}

function fallbackCopy(value: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}

function FieldControl({
  field,
  value,
  invalid,
  label,
  onChange,
}: {
  field: PromptFieldDefinition;
  value: string;
  invalid: boolean;
  label: string;
  onChange: (value: string) => void;
}) {
  const common = {
    id: `prompt-field-${field.id}`,
    'data-prompt-control': true,
    'aria-required': field.required,
    'aria-invalid': invalid || undefined,
    value,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value),
  } as const;

  if (field.type === 'textarea') {
    return <textarea {...common} rows={4} />;
  }

  if (field.type === 'select') {
    return (
      <select {...common}>
        <option value="">{label}</option>
        {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  return <input {...common} type={field.type === 'number' ? 'number' : 'text'} />;
}

export function PromptBuilder({ uiLocale, schema, records }: PromptBuilderProps) {
  const copy = promptBuilderCopy[uiLocale];
  const [values, setValues] = useState<Record<string, string>>({});
  const [outputLanguage, setOutputLanguage] = useState<PromptOutputLanguage>(uiLocale);
  const [tone, setTone] = useState<PromptTone>('');
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const interactiveFields = schema.fields.filter((field) => field.type !== 'asset-reference');
  const assetFields = schema.fields.filter((field) => field.type === 'asset-reference');

  const setFieldValue = (fieldId: string, value: string) => {
    setValues((current) => ({ ...current, [fieldId]: value }));
    setInvalidFields((current) => {
      if (!current.has(fieldId)) return current;
      const next = new Set(current);
      next.delete(fieldId);
      return next;
    });
  };

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const missing = interactiveFields
      .filter((field) => field.required && !values[field.id]?.trim())
      .map((field) => field.id);

    if (missing.length > 0) {
      setInvalidFields(new Set(missing));
      setOutput('');
      return;
    }

    setInvalidFields(new Set());
    setOutput(buildPrompt({
      record: records[outputLanguage],
      fields: schema.fields,
      values,
      outputLanguage,
      tone,
    }));
  };

  const handleCopy = async () => {
    if (!output) return;
    let didCopy = false;
    try {
      await navigator.clipboard.writeText(output);
      didCopy = true;
    } catch {
      didCopy = fallbackCopy(output);
    }
    if (!didCopy) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), 1000);
  };

  return (
    <section className="prompt-builder" data-prompt-builder aria-labelledby="prompt-builder-heading">
      <header className="prompt-builder__header">
        <div>
          <p className="prompt-builder__eyebrow">{copy.eyebrow}</p>
          <h2 id="prompt-builder-heading">{copy.heading}</h2>
        </div>
        <p>{copy.description}</p>
      </header>

      <form className="prompt-builder__form" onSubmit={handleGenerate} noValidate>
        <div className="prompt-builder__settings">
          <label>
            <span>{copy.outputLanguage}</span>
            <select
              value={outputLanguage}
              onChange={(event) => setOutputLanguage(event.target.value as PromptOutputLanguage)}
            >
              <option value="ar">{copy.arabic}</option>
              <option value="en">{copy.english}</option>
            </select>
          </label>

          <label>
            <span>{copy.tone}</span>
            <select value={tone} onChange={(event) => setTone(event.target.value as PromptTone)}>
              <option value="">{copy.toneNone}</option>
              <option value="professional">{copy.toneProfessional}</option>
              <option value="concise">{copy.toneConcise}</option>
              <option value="expressive">{copy.toneExpressive}</option>
            </select>
          </label>
        </div>

        {interactiveFields.length > 0 ? (
          <div className="prompt-builder__fields">
            {interactiveFields.map((field) => {
              const label = schema.fallback && field.id === 'required-inputs' ? copy.fallbackField : field.label;
              const invalid = invalidFields.has(field.id);
              return (
                <div className="prompt-builder__field" data-prompt-field key={field.id}>
                  <label htmlFor={`prompt-field-${field.id}`}>{label}</label>
                  <FieldControl
                    field={field}
                    value={values[field.id] ?? ''}
                    invalid={invalid}
                    label={copy.selectPlaceholder}
                    onChange={(value) => setFieldValue(field.id, value)}
                  />
                  {invalid ? <span className="prompt-builder__field-error">{copy.requiredField}</span> : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {assetFields.length > 0 ? (
          <div className="prompt-builder__assets" aria-label={copy.attachments}>
            <h3>{copy.attachments}</h3>
            {assetFields.map((field) => (
              <div className="prompt-builder__asset" data-asset-reminder key={field.id}>
                <IyaazIcon name="external" />
                <span><strong>{field.label}</strong> — {copy.assetReminder}</span>
              </div>
            ))}
          </div>
        ) : null}

        {invalidFields.size > 0 ? <p className="prompt-builder__alert" role="alert">{copy.validation}</p> : null}

        <button className="prompt-builder__generate" type="submit">{copy.generate}</button>
      </form>

      {output ? (
        <div className="prompt-builder__result">
          <div className="prompt-builder__result-heading">
            <label htmlFor="prompt-builder-output">{copy.output}</label>
            <button type="button" onClick={handleCopy} aria-label={copied ? copy.copied : copy.copy}>
              <IyaazIcon name={copied ? 'check' : 'copy'} />
              <span>{copied ? copy.copied : copy.copy}</span>
            </button>
          </div>
          <textarea
            id="prompt-builder-output"
            data-prompt-output
            readOnly
            value={output}
            rows={16}
            dir={outputLanguage === 'ar' ? 'rtl' : 'ltr'}
            lang={outputLanguage}
          />
        </div>
      ) : null}
    </section>
  );
}
