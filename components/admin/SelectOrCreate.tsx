'use client';

import { useEffect, useRef, useState } from 'react';

import { apiFetch } from '@/lib/client-api';
import { cn } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';

/**
 * A dropdown that can also create the thing it is choosing from.
 *
 * New stock arrives from new suppliers and in new categories all the time. A
 * plain <select> meant the owner had to abandon a half-filled product form,
 * navigate away to create the brand or category, and start over — and brands
 * could not be created anywhere at all. Choosing "Add new…" opens an inline
 * field instead, so the product being entered is never lost.
 *
 * The new record is saved immediately rather than with the product, because
 * the product's own save needs an id to reference.
 */

export interface Option {
  id: string;
  name: string;
}

interface Props {
  id: string;
  label: string;
  /** POST target that creates the record and returns it as `{ id, name }`. */
  endpoint: string;
  /** Extra fields sent alongside `name`, e.g. a subcategory's `parent_id`. */
  payload?: Record<string, unknown>;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  /** Called with the created record so the parent can add it to its list. */
  onCreated: (created: Option) => void;
  /** Text of the empty option, e.g. "No brand". */
  placeholder: string;
  addLabel: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Shown under the field when the control is disabled. */
  disabledHint?: string;
}

const ADD = '__add__';

export function SelectOrCreate({
  id,
  label,
  endpoint,
  payload,
  options,
  value,
  onChange,
  onCreated,
  placeholder,
  addLabel,
  required,
  disabled,
  invalid,
  disabledHint,
}: Props) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus follows the mode change, so the field is usable from the keyboard.
  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const cancel = () => {
    setAdding(false);
    setName('');
  };

  async function create() {
    const clean = name.trim();
    if (clean.length < 2) {
      toast.error(`Enter a ${label.toLowerCase()} name first.`);
      inputRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const created = await apiFetch<Option>(endpoint, {
        method: 'POST',
        json: { name: clean, ...payload },
      });
      onCreated(created);
      onChange(created.id);
      // The server may return an existing record when the name already maps to
      // the same slug, so report what actually happened.
      toast.success(
        created.name.toLowerCase() === clean.toLowerCase()
          ? `${created.name} added.`
          : `Using existing ${label.toLowerCase()} "${created.name}".`,
      );
      cancel();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  if (adding) {
    return (
      <div>
        <label htmlFor={`${id}-new`} className="label">
          New {label.toLowerCase()}
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id={`${id}-new`}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              // The form's own submit must not fire while naming a brand.
              if (e.key === 'Enter') {
                e.preventDefault();
                void create();
              }
              if (e.key === 'Escape') cancel();
            }}
            placeholder={`e.g. ${addLabel}`}
            disabled={saving}
            autoComplete="off"
          />
          <button
            type="button"
            className="btn btn-primary shrink-0"
            onClick={() => void create()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
          <button type="button" className="btn btn-ghost shrink-0" onClick={cancel} disabled={saving}>
            Cancel
          </button>
        </div>
        <p className="hint">Saved straight away, then selected here.</p>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-brand-red">*</span>}
      </label>
      <select
        id={id}
        className={cn('input', invalid && 'border-brand-red')}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.value === ADD) {
            setAdding(true);
            return;
          }
          onChange(e.target.value);
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
        {!disabled && <option value={ADD}>+ Add new {label.toLowerCase()}…</option>}
      </select>
      {disabled && disabledHint && <p className="hint">{disabledHint}</p>}
    </div>
  );
}
