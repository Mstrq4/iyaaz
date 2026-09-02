'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

import { promptBuilderCopy, type Locale } from '../../lib/i18n';
import type { LocalizedLibraryRecord } from '../../lib/library/types';
import {
  assemblePrompt,
  isAttachmentRequirement,
  type PromptFieldValue,
  type PromptLanguage,
} from '../../lib/prompt/assemble';
import type { PromptFieldDescriptor } from '../../lib/prompt/schema';
import { IyaazIcon } from '../icons/IyaazIcon';
import { PromptField } from './PromptField';

interface PromptBuilderProps {
  uiLocale: Locale;
  schema: PromptFieldDescriptor[];
  records: Record<Locale, LocalizedLibraryRecord>;
}

interface PromptDraft {
  values: Record<string, string>;
  notes: string;
}

function draftKey(recordId: number, language: PromptLanguage): string {
  return `iyaaz:prompt-draft:${recordId}:${language}`;
}

function readDraft(recordId: number, language: PromptLanguage): PromptDraft {
  try {
    const raw = sessionStorage.getItem(draftKey(recordId, language));
    if (!raw) return { values: {}, notes: '' };
    const parsed = JSON.parse(raw) as Partial<PromptDraft>;
    const values = parsed.values && typeof parsed.values === 'object'
      ? Object.fromEntries(Object.entries(parsed.values).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
      : {};
    return {
      values,
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    };
  } catch {
    return { values: {}, notes: '' };
  }
}

function writeDraft(recordId: number, language: PromptLanguage, draft: PromptDraft): void {
  try {
    sessionStorage.setItem(draftKey(recordId, language), JSON.stringify(draft));
  } catch {
    // Session persistence is best-effort; prompt generation remains fully local and functional.
  }
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

export function PromptBuilder({ uiLocale, schema, records }: PromptBuilderProps) {
  const copy = promptBuilderCopy[uiLocale];
  const [outputLanguage, setOutputLanguage] = useState<PromptLanguage>(uiLocale);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordId = records.ar.id;

  useEffect(() => {
    const draft = readDraft(recordId, outputLanguage);
    setValues(draft.values);
    setNotes(draft.notes);
    setInvalidFields(new Set());
    setOutput('');
  }, [recordId, outputLanguage]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const interactiveFields = schema.filter((field) => !isAttachmentRequirement(field.sourceFragment));

  const setFieldValue = (fieldId: string, value: string) => {
    setValues((current) => {
      const next = { ...current, [fieldId]: value };
      writeDraft(recordId, outputLanguage, { values: next, notes });
      return next;
    });
    setOutput('');
    setInvalidFields((current) => {
      if (!current.has(fieldId)) return current;
      const next = new Set(current);
      next.delete(fieldId);
      return next;
    });
  };

  const setDraftNotes = (value: string) => {
    setNotes(value);
    writeDraft(recordId, outputLanguage, { values, notes: value });
    setOutput('');
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
    const fieldValues: PromptFieldValue[] = schema.map((field) => ({
      ...field,
      value: values[field.id] ?? '',
    }));
    const result = assemblePrompt({
      record: records[outputLanguage],
      language: outputLanguage,
      fields: fieldValues,
      notes,
    });
    setOutput(result.text);
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
    <section id="prompt-builder" className="prompt-builder" data-prompt-builder aria-labelledby="prompt-builder-heading">
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
              onChange={(event) => setOutputLanguage(event.target.value as PromptLanguage)}
            >
              <option value="ar">{copy.arabic}</option>
              <option value="en">{copy.english}</option>
            </select>
          </label>
        </div>

        {schema.length > 0 ? (
          <div className="prompt-builder__fields">
            {schema.map((field) => (
              <PromptField
                key={field.id}
                field={field}
                displayLabel={field.id === 'project_details' ? copy.fallbackField : field.label}
                value={values[field.id] ?? ''}
                invalid={invalidFields.has(field.id)}
                selectPlaceholder={copy.selectPlaceholder}
                booleanYes={copy.booleanYes}
                booleanNo={copy.booleanNo}
                requiredMessage={copy.requiredField}
                assetReminder={copy.assetReminder}
                onChange={(value) => setFieldValue(field.id, value)}
              />
            ))}
          </div>
        ) : null}

        <div className="prompt-builder__field prompt-builder__notes">
          <label htmlFor="prompt-builder-notes">{copy.notes}</label>
          <textarea
            id="prompt-builder-notes"
            value={notes}
            placeholder={copy.notesPlaceholder}
            rows={4}
            onChange={(event) => setDraftNotes(event.target.value)}
          />
        </div>

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
