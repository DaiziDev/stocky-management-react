import { cn, currencyDecimals, currencySymbol } from "@/lib/utils";
import { CURRENCY } from "@/lib/constants";
import { Input } from "@/components/ui/Input";
import { InputHTMLAttributes, useId, useRef, useState } from "react";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  useFormState,
  type Control,
} from "react-hook-form";

/**
 * Text state for a numeric `<input>`, bound to a react-hook-form field.
 *
 * React compares a number input's DOM value to its prop with LOOSE equality,
 * so `"010" == 10` is true and React leaves the DOM alone: a field defaulting
 * to 0 shows "01" after typing 1, and "010" after typing 10, even though the
 * stored value is correct. Keeping the typed text here and only pushing the
 * parsed number to the form means the field always displays exactly what was
 * typed, while the form still stores a number (or undefined when cleared).
 *
 * The text re-syncs when the form value changes from the outside — a reset,
 * or an edit dialog loading a record — but not while the user is typing, so
 * an in-progress "1." or "-" is never rewritten under the cursor.
 */
function useNumericInput(
  value: unknown,
  onChange: (next: number | undefined) => void,
) {
  const asNumber = typeof value === "number" ? value : undefined;
  const [text, setText] = useState(() =>
    asNumber === undefined ? "" : String(asNumber),
  );

  // Track what the form last told us, to tell an external change from our own.
  const lastPushed = useRef(asNumber);
  if (lastPushed.current !== asNumber) {
    lastPushed.current = asNumber;
    const fromText = text.trim() === "" ? undefined : Number(text);
    if (fromText !== asNumber) {
      setText(asNumber === undefined ? "" : String(asNumber));
    }
  }

  const handleChange = (raw: string) => {
    setText(raw);
    const trimmed = raw.trim();
    const parsed = trimmed === "" ? undefined : Number(trimmed);
    const next =
      parsed === undefined || Number.isNaN(parsed) ? undefined : parsed;
    lastPushed.current = next;
    onChange(next);
  };

  /** Drop a leading zero once the user leaves the field ("07" → "7"). */
  const handleBlur = () => {
    if (text.trim() !== "" && !Number.isNaN(Number(text))) {
      const normalized = String(Number(text));
      if (normalized !== text) setText(normalized);
    }
  };

  return { text, handleChange, handleBlur };
}

interface NumericInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> {
  value: unknown;
  onValueChange: (next: number | undefined) => void;
}

/**
 * The `<input type="number">` every numeric field shares, driven by
 * `useNumericInput` so what is displayed is always what was typed.
 */
function NumericInput({
  value,
  onValueChange,
  onBlur,
  ...props
}: NumericInputProps) {
  const { text, handleChange, handleBlur } = useNumericInput(
    value,
    onValueChange,
  );

  return (
    <input
      {...props}
      type="number"
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      onBlur={(event) => {
        handleBlur();
        onBlur?.(event);
      }}
    />
  );
}

/**
 * Validation message for one field.
 *
 * Every field below accepts an explicit `error` prop, but nothing was passing
 * one: zod ran on submit and its messages were silently dropped, so forms
 * simply refused to submit with no visible reason. This hook subscribes to
 * the field's own error state (scoped by `name`, so unrelated fields don't
 * re-render) and lets an explicit prop win when a caller supplies one.
 */
function useFieldError<T extends FieldValues>(
  control: Control<T> | undefined,
  name: FieldPath<T>,
  override?: string,
): string | undefined {
  const { errors } = useFormState({ control, name });
  if (override) return override;

  // `name` may be a path ("lines.0.quantity"); walk it to reach the node.
  const node = name
    .split(".")
    .reduce<unknown>(
      (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
      errors,
    );
  const message = (node as { message?: unknown } | undefined)?.message;
  return typeof message === "string" ? message : undefined;
}

interface FormFieldProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  "name" | "render"
> {
  name: FieldPath<T>;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  /** Forwarded to the underlying <Input> (e.g. type="email" | "tel"). */
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
}

export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  error: errorProp,
  helperText,
  required,
  rules,
  ...props
}: FormFieldProps<T>) {
  const error = useFieldError(control, name, errorProp);
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <Input
          {...field}
          {...props}
          label={label}
          error={error}
          helperText={helperText}
          required={required}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

interface SelectFieldProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  "name" | "render"
> {
  name: FieldPath<T>;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export function SelectField<T extends FieldValues>({
  name,
  control,
  label,
  error: errorProp,
  helperText,
  required,
  options,
  placeholder,
  rules,
  ...props
}: SelectFieldProps<T>) {
  const error = useFieldError(control, name, errorProp);
  const fieldId = useId();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        // Rendered like every other field: a real <label> (this used to be an
        // aria-label only, invisible to sighted users) and the validation
        // message below, which was previously dropped entirely — a required
        // select could fail silently with only a red border to show for it.
        <div className="w-full">
          {label && (
            <label
              htmlFor={fieldId}
              className="mb-1.5 block text-sm font-medium text-content-secondary"
            >
              {label}
              {required && <span className="text-danger-500"> *</span>}
            </label>
          )}
          <select
            {...field}
            {...props}
            id={fieldId}
            className={cn(
              "w-full px-3 py-2 rounded-sm border bg-surface dark:bg-[color:var(--dark-input)] text-content dark:text-[color:var(--dark-text-primary)]",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              error
                ? "border-danger-500 focus:ring-danger-500/20"
                : "border-border-strong dark:border-[color:var(--dark-border)]",
              props.className,
            )}
            aria-invalid={error ? "true" : "false"}
            onBlur={field.onBlur}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && (
            <p
              className="mt-1.5 text-sm text-danger-600 dark:text-danger-500"
              role="alert"
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="mt-1.5 text-sm text-content-muted">{helperText}</p>
          )}
        </div>
      )}
    />
  );
}

interface CheckboxFieldProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  "name" | "render"
> {
  name: FieldPath<T>;
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export function CheckboxField<T extends FieldValues>({
  name,
  control,
  label,
  error: errorProp,
  helperText,
  rules,
  ...props
}: CheckboxFieldProps<T>) {
  const error = useFieldError(control, name, errorProp);
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-content">
            <input
              type="checkbox"
              checked={Boolean(field.value)}
              onChange={(e) => field.onChange(e.target.checked)}
              onBlur={field.onBlur}
              className="h-4 w-4 rounded border-border-strong text-primary accent-[color:var(--color-primary-600)]"
              {...props}
            />
            {label}
          </label>
          {error && (
            <p
              className="mt-1 text-sm text-danger-600 dark:text-danger-500"
              role="alert"
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="mt-1 text-sm text-content-muted">{helperText}</p>
          )}
        </div>
      )}
    />
  );
}

interface CurrencyInputFieldProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  "name" | "render"
> {
  name: FieldPath<T>;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  /** Currency code; defaults to the app currency (see lib/constants). */
  currency?: string;
  className?: string;
}

/**
 * Money input — stores a number, displays the app currency.
 * The step follows the currency's real precision: 1 for a zero-decimal
 * currency like the franc CFA, 0.01 for euros.
 */
export function CurrencyInputField<T extends FieldValues>({
  name,
  control,
  label,
  error: errorProp,
  helperText,
  required,
  currency = CURRENCY,
  rules,
  ...props
}: CurrencyInputFieldProps<T>) {
  const error = useFieldError(control, name, errorProp);
  const fieldId = useId();
  const decimals = currencyDecimals(currency);
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <div>
          {label && (
            <label
              htmlFor={fieldId}
              className="mb-1.5 block text-sm font-medium text-content-secondary"
            >
              {label}
              {required && <span className="text-danger-500"> *</span>}
            </label>
          )}
          <div className="relative">
            <NumericInput
              id={fieldId}
              inputMode={decimals > 0 ? "decimal" : "numeric"}
              min={0}
              step={decimals > 0 ? 10 ** -decimals : 1}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              className={cn(
                "w-full rounded-sm border bg-surface px-3 py-2 pr-12 text-content dark:bg-[color:var(--dark-input)] dark:text-[color:var(--dark-text-primary)]",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                error
                  ? "border-danger-500 focus:ring-danger-500/20"
                  : "border-border-strong dark:border-[color:var(--dark-border)]",
                props.className,
              )}
              aria-invalid={error ? "true" : "false"}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-content-muted">
              {currencySymbol(currency)}
            </span>
          </div>
          {error && (
            <p
              className="mt-1 text-sm text-danger-600 dark:text-danger-500"
              role="alert"
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="mt-1 text-sm text-content-muted">{helperText}</p>
          )}
        </div>
      )}
    />
  );
}

interface NumberFieldProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  "name" | "render"
> {
  name: FieldPath<T>;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  /** Optional suffix rendered at the field's right edge (e.g. '%'). */
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/** Numeric input bound to a RHF field — stores a number or undefined. */
export function NumberField<T extends FieldValues>({
  name,
  control,
  label,
  error: errorProp,
  helperText,
  required,
  suffix,
  min,
  max,
  step,
  rules,
  ...props
}: NumberFieldProps<T>) {
  const error = useFieldError(control, name, errorProp);
  const fieldId = useId();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <div>
          {label && (
            <label
              htmlFor={fieldId}
              className="mb-1.5 block text-sm font-medium text-content-secondary"
            >
              {label}
              {required && <span className="text-danger-500"> *</span>}
            </label>
          )}
          <div className="relative">
            <NumericInput
              id={fieldId}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              min={min}
              max={max}
              step={step}
              className={cn(
                "w-full rounded-sm border bg-surface px-3 py-2 text-content dark:bg-[color:var(--dark-input)] dark:text-[color:var(--dark-text-primary)]",
                suffix && "pr-8",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                error
                  ? "border-danger-500 focus:ring-danger-500/20"
                  : "border-border-strong dark:border-[color:var(--dark-border)]",
                props.className,
              )}
              aria-invalid={error ? "true" : "false"}
            />
            {suffix && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-content-muted">
                {suffix}
              </span>
            )}
          </div>
          {error && (
            <p
              className="mt-1 text-sm text-danger-600 dark:text-danger-500"
              role="alert"
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="mt-1 text-sm text-content-muted">{helperText}</p>
          )}
        </div>
      )}
    />
  );
}

interface PercentFieldProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  "name" | "render"
> {
  name: FieldPath<T>;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  /** Bounds expressed in PERCENT (default 0–100). */
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Rate input that reads and writes a PERCENTAGE while the form stores a
 * decimal fraction (19.25 shown ↔ 0.1925 stored).
 *
 * The domain keeps VAT as a fraction — that is the convention the mappers
 * convert at the wire boundary — but nobody types "0.1925" for a VAT rate.
 * Keeping the conversion inside this component means the schema, the domain
 * model and the mappers are all untouched, and there is exactly one place
 * where percent and fraction meet.
 */
export function PercentField<T extends FieldValues>({
  name,
  control,
  label,
  error: errorProp,
  helperText,
  required,
  min = 0,
  max = 100,
  step = 0.01,
  rules,
  ...props
}: PercentFieldProps<T>) {
  const error = useFieldError(control, name, errorProp);
  const fieldId = useId();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => {
        const fraction =
          typeof field.value === "number" ? field.value : undefined;
        // Round the trip through ×100 so 0.1925 shows as 19.25, not 19.2500001.
        const percent =
          fraction === undefined ? undefined : Math.round(fraction * 1e6) / 1e4;

        return (
          <div>
            {label && (
              <label
                htmlFor={fieldId}
                className="mb-1.5 block text-sm font-medium text-content-secondary"
              >
                {label}
                {required && <span className="text-danger-500"> *</span>}
              </label>
            )}
            <div className="relative">
              <NumericInput
                id={fieldId}
                value={percent}
                onValueChange={(next) =>
                  field.onChange(
                    next === undefined
                      ? undefined
                      : Math.round(next * 1e4) / 1e6,
                  )
                }
                onBlur={field.onBlur}
                min={min}
                max={max}
                step={step}
                inputMode="decimal"
                className={cn(
                  "w-full rounded-sm border bg-surface px-3 py-2 pr-8 text-content dark:bg-[color:var(--dark-input)] dark:text-[color:var(--dark-text-primary)]",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                  error
                    ? "border-danger-500 focus:ring-danger-500/20"
                    : "border-border-strong dark:border-[color:var(--dark-border)]",
                  props.className,
                )}
                aria-invalid={error ? "true" : "false"}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-content-muted">
                %
              </span>
            </div>
            {error && (
              <p
                className="mt-1 text-sm text-danger-600 dark:text-danger-500"
                role="alert"
              >
                {error}
              </p>
            )}
            {helperText && !error && (
              <p className="mt-1 text-sm text-content-muted">{helperText}</p>
            )}
          </div>
        );
      }}
    />
  );
}

interface DateFieldProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  "name" | "render"
> {
  name: FieldPath<T>;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

/** Native date picker bound to a RHF field (value: ISO yyyy-MM-dd or undefined). */
export function DateField<T extends FieldValues>({
  name,
  control,
  label,
  error: errorProp,
  helperText,
  required,
  rules,
  ...props
}: DateFieldProps<T>) {
  const error = useFieldError(control, name, errorProp);
  const fieldId = useId();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <div>
          {label && (
            <label
              htmlFor={fieldId}
              className="mb-1.5 block text-sm font-medium text-content-secondary"
            >
              {label}
              {required && <span className="text-danger-500"> *</span>}
            </label>
          )}
          <input
            id={fieldId}
            type="date"
            value={(field.value as string | undefined) ?? ""}
            onChange={(e) => field.onChange(e.target.value || undefined)}
            onBlur={field.onBlur}
            className={cn(
              "w-full rounded-sm border bg-surface px-3 py-2 text-content dark:bg-[color:var(--dark-input)] dark:text-[color:var(--dark-text-primary)]",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              error
                ? "border-danger-500 focus:ring-danger-500/20"
                : "border-border-strong dark:border-[color:var(--dark-border)]",
              props.className,
            )}
            aria-invalid={error ? "true" : "false"}
          />
          {error && (
            <p
              className="mt-1 text-sm text-danger-600 dark:text-danger-500"
              role="alert"
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="mt-1 text-sm text-content-muted">{helperText}</p>
          )}
        </div>
      )}
    />
  );
}

interface TextareaFieldProps<T extends FieldValues> extends Omit<
  ControllerProps<T>,
  "name" | "render"
> {
  name: FieldPath<T>;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export function TextareaField<T extends FieldValues>({
  name,
  control,
  label,
  error: errorProp,
  rules,
  ...props
}: TextareaFieldProps<T>) {
  const error = useFieldError(control, name, errorProp);
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <textarea
          {...field}
          {...props}
          className={cn(
            "w-full px-3 py-2 rounded-sm border bg-surface dark:bg-[color:var(--dark-input)] text-content dark:text-[color:var(--dark-text-primary)]",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            error
              ? "border-danger-500 focus:ring-danger-500/20"
              : "border-border-strong dark:border-[color:var(--dark-border)]",
            props.className,
          )}
          aria-invalid={error ? "true" : "false"}
          onBlur={field.onBlur}
          aria-label={label}
        />
      )}
    />
  );
}
