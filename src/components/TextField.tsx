import { useId } from "react";
import ClearableInput from "./ClearableInput";
import { Field, FieldLabel, FieldDescription, FieldError } from "./ui/field";
import { Input } from "./ui/input";
import { cn } from "cn";

type TextFieldProps = React.ComponentProps<typeof Input> & {
  label?: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
  hideDescription?: boolean;
  hideErrorDescription?: boolean;
  onClear?: () => void;
};

function TextField({
  label,
  description,
  error,
  hideLabel = false,
  hideDescription = false,
  hideErrorDescription = false,
  onClear,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = inputProps.id ?? `text-field-${generatedId}`;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;
  const messageId = error ? errorId : description ? descriptionId : undefined;
  const describedBy =
    [inputProps["aria-describedby"], messageId].filter(Boolean).join(" ") ||
    undefined;
  const sharedInputProps = {
    ...inputProps,
    id: inputId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : inputProps["aria-invalid"],
  };

  return (
    <Field className="gap-4 font-medium" data-invalid={!!error}>
      {label && (
        <FieldLabel
          htmlFor={inputId}
          className={cn("text-foreground", { hidden: hideLabel })}
        >
          {label}
        </FieldLabel>
      )}
      {onClear ? (
        <ClearableInput {...sharedInputProps} onClear={onClear} />
      ) : (
        <Input {...sharedInputProps} />
      )}
      {error ? (
        <FieldError
          id={errorId}
          className={cn("font-medium", { hidden: hideErrorDescription })}
        >
          {error}
        </FieldError>
      ) : (
        description && (
          <FieldDescription
            id={descriptionId}
            className={cn("font-medium", { hidden: hideDescription })}
          >
            {description}
          </FieldDescription>
        )
      )}
    </Field>
  );
}

export default TextField;
