"use client";

import { cn } from "cn";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  useAnimationControls,
  useReducedMotion,
} from "motion/react";
import * as m from "motion/react-m";
import type React from "react";
import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import {
  DURATION_INSTANT,
  SPRING_DEFAULT,
  SPRING_SNAPPY,
} from "@/components/smoothui/lib/animation";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGGER_DELAY = 0.04;
const SHAKE_KEYFRAMES = [0, -6, 5, -4, 3, -1, 0];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FormErrors = Record<string, string | undefined>;

export interface FormProps extends React.ComponentProps<"form"> {
  /** Form contents */
  children: React.ReactNode;
  /** Optional CSS class */
  className?: string;
  /** External errors object (e.g. from react-hook-form's `formState.errors`) */
  errors?: FormErrors;
  /** Callback invoked on native form submit with current errors map */
  onFormSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export interface FormFieldProps {
  /** Field contents (label, input, message) */
  children: React.ReactNode;
  /** Optional CSS class for the field wrapper */
  className?: string;
  /** Unique field name — used to look up errors */
  name: string;
}

export interface FormLabelProps extends React.ComponentProps<"label"> {
  /** Label text */
  children: React.ReactNode;
  /** Optional CSS class */
  className?: string;
}

export interface FormMessageProps {
  /** Override the error message (otherwise pulled from FormField context) */
  children?: React.ReactNode;
  /** Optional CSS class */
  className?: string;
}

export interface FormDescriptionProps extends React.ComponentProps<"p"> {
  /** Description text */
  children: React.ReactNode;
  /** Optional CSS class */
  className?: string;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface FormContextValue {
  errors: FormErrors;
  submitCount: number;
}

interface FormFieldContextValue {
  error: string | undefined;
  fieldIndex: number;
  formDescriptionId: string;
  formItemId: string;
  formMessageId: string;
  id: string;
  name: string;
  submitCount: number;
}

const FormContext = createContext<FormContextValue>({
  errors: {},
  submitCount: 0,
});
const FormFieldContext = createContext<FormFieldContextValue | null>(null);

const useFormCtx = () => useContext(FormContext);

const useFormFieldCtx = () => {
  const ctx = useContext(FormFieldContext);
  if (!ctx) {
    throw new Error("FormLabel / FormMessage must be used inside <FormField>");
  }
  return ctx;
};

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

export default function Form({
  errors = {},
  onFormSubmit,
  className,
  children,
  ...props
}: FormProps) {
  const [submitCount, setSubmitCount] = useState(0);

  const ctxValue = useMemo(
    () => ({ errors, submitCount }),
    [errors, submitCount]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      setSubmitCount((c) => c + 1);
      if (onFormSubmit) {
        onFormSubmit(e);
      }
    },
    [onFormSubmit]
  );

  return (
    <LazyMotion features={domAnimation}>
      <FormContext.Provider value={ctxValue}>
        <form
          className={cn("grid gap-3", className)}
          noValidate
          onSubmit={handleSubmit}
          {...props}
        >
          {children}
        </form>
      </FormContext.Provider>
    </LazyMotion>
  );
}

// ---------------------------------------------------------------------------
// FormField — staggered entrance + validation shake
// ---------------------------------------------------------------------------

export function FormField({ name, className, children }: FormFieldProps) {
  const { errors, submitCount } = useFormCtx();
  const id = useId();
  const error = errors[name];

  const ctxValue = useMemo(
    () => ({
      error,
      fieldIndex: 0,
      formDescriptionId: `${id}-form-item-description`,
      formItemId: `${id}-form-item`,
      formMessageId: `${id}-form-item-message`,
      id,
      name,
      submitCount,
    }),
    [name, id, error, submitCount]
  );

  return (
    <FormFieldContext.Provider value={ctxValue}>
      <FormFieldInner className={className}>{children}</FormFieldInner>
    </FormFieldContext.Provider>
  );
}

/** Inner component that can consume FormFieldContext */
function FormFieldInner({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();
  const { error, fieldIndex, submitCount } = useFormFieldCtx();
  const shakeControls = useAnimationControls();

  // Shake when a new error appears on submit
  const shouldShake = error && submitCount > 0;

  useEffect(() => {
    if (shouldShake && !shouldReduceMotion) {
      void shakeControls.start({ x: SHAKE_KEYFRAMES });
    }
  }, [shakeControls, shouldReduceMotion, shouldShake, submitCount]);

  return (
    <m.div
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      className={cn("grid gap-1.5", className)}
      data-slot="form-field"
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      transition={
        shouldReduceMotion
          ? DURATION_INSTANT
          : {
              ...SPRING_DEFAULT,
              delay: fieldIndex * STAGGER_DELAY,
            }
      }
    >
      <m.div
        animate={shakeControls}
        className="grid gap-1.5"
        initial={false}
        transition={
          shouldReduceMotion
            ? DURATION_INSTANT
            : { duration: 0.4, ease: [0.36, 0.07, 0.19, 0.97] }
        }
      >
        {children}
      </m.div>
    </m.div>
  );
}

// ---------------------------------------------------------------------------
// FormLabel
// ---------------------------------------------------------------------------

export function FormLabel({ className, children, ...props }: FormLabelProps) {
  const { formItemId, error } = useFormFieldCtx();

  return (
    <label
      className={cn(
        "font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        error && "text-destructive",
        className
      )}
      data-slot="form-label"
      htmlFor={formItemId}
      {...props}
    >
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// FormControl — renders a wrapper with animated focus ring
// ---------------------------------------------------------------------------

export function FormControl({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const { formItemId, formDescriptionId, formMessageId, error } =
    useFormFieldCtx();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <m.div
      animate={
        shouldReduceMotion
          ? {}
          : {
              boxShadow: isFocused
                ? "0 0 0 3px hsl(var(--ring) / 0.3)"
                : "0 0 0 0px hsl(var(--ring) / 0)",
            }
      }
      className={cn("rounded-md", className)}
      data-slot="form-control"
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      transition={shouldReduceMotion ? DURATION_INSTANT : SPRING_SNAPPY}
    >
      {cloneChildWithA11y(children, {
        "aria-describedby": error
          ? `${formDescriptionId} ${formMessageId}`
          : formDescriptionId,
        "aria-invalid": error ? true : undefined,
        id: formItemId,
      })}
    </m.div>
  );
}

function cloneChildWithA11y(
  children: React.ReactNode,
  a11yProps: Record<string, unknown>
): React.ReactNode {
  const child = Array.isArray(children) ? children[0] : children;
  if (child && typeof child === "object" && "type" in child) {
    const element = child as React.ReactElement<Record<string, unknown>>;
    // biome-ignore lint/suspicious/noExplicitAny: cloneElement requires flexible typing
    return cloneElement(element, a11yProps);
  }
  return children;
}

// ---------------------------------------------------------------------------
// FormDescription
// ---------------------------------------------------------------------------

export function FormDescription({
  className,
  children,
  ...props
}: FormDescriptionProps) {
  const { formDescriptionId } = useFormFieldCtx();

  return (
    <p
      className={cn("text-muted-foreground text-sm", className)}
      data-slot="form-description"
      id={formDescriptionId}
      {...props}
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// FormMessage — animated error message
// ---------------------------------------------------------------------------

export function FormMessage({ className, children }: FormMessageProps) {
  const shouldReduceMotion = useReducedMotion();
  const { error, formMessageId } = useFormFieldCtx();

  const body = children ?? error;

  return (
    <div>
      <AnimatePresence mode="wait">
        {body ? (
          <m.p
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            className={cn("text-destructive text-sm", className)}
            data-slot="form-message"
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, y: -4 }
            }
            id={formMessageId}
            initial={
              shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }
            }
            key={typeof body === "string" ? body : "message"}
            role="alert"
            transition={shouldReduceMotion ? DURATION_INSTANT : SPRING_DEFAULT}
          >
            {body}
          </m.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
