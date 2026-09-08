import { useId, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { Select, type SelectOption } from '@/components/common/Select';
import { cn } from '@/lib/cn';

export type { SelectOption };

const CONTROL =
  'w-full rounded-xl border bg-white px-4 text-[15px] text-ink transition-colors ' +
  'placeholder:text-ink-soft/60 focus:outline-none focus:ring-4 disabled:opacity-60';

const OK = 'border-ink-line focus:border-brand-300 focus:ring-brand-100';
const BAD = 'border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100';

function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label id={`${id}-label`} htmlFor={id} className="mb-2 block text-[13px] font-semibold text-ink">
        {label}
        {required && (
          <span className="ml-1 text-rose-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-rose-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-[12.5px] text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
}

export function TextField({
  label,
  error,
  hint,
  className,
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={rest.required} className={className}>
      <input
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(CONTROL, 'h-12', error ? BAD : OK)}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = rest.id ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={rest.required} className={className}>
      <textarea
        {...rest}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(CONTROL, 'min-h-[132px] resize-y py-3.5 leading-relaxed', error ? BAD : OK)}
      />
    </FieldShell>
  );
}

export interface SelectFieldProps extends BaseProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Labelled form field wrapping the custom `Select`. It takes an `options`
 * array rather than `<option>` children, because the listbox needs the option
 * data (not JSX) to drive keyboard navigation and typeahead.
 */
export function SelectField({
  label,
  error,
  hint,
  className,
  options,
  value,
  onValueChange,
  placeholder,
  name,
  id,
  required,
  disabled,
}: SelectFieldProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <Select
        id={fieldId}
        name={name}
        options={options}
        value={value}
        onChange={onValueChange}
        placeholder={placeholder}
        disabled={disabled}
        invalid={Boolean(error)}
        size="lg"
        ariaLabelledBy={`${fieldId}-label`}
        ariaDescribedBy={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
      />
    </FieldShell>
  );
}

/* ------------------------------------------------------------- validation */

export type Errors<T> = Partial<Record<keyof T, string>>;

/** Indian mobile numbers, tolerant of spaces, dashes and a +91 prefix. */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/[^\d]/g, '');
  const local = digits.startsWith('91') && digits.length > 10 ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim());
}

export function required(value: string, message: string): string | undefined {
  return value.trim() === '' ? message : undefined;
}
