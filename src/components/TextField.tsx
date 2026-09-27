import { useId } from "react";
import ActionInput from "./ActionInput";
import { Field, FieldLabel, FieldDescription, FieldError } from "./ui/field";
import { cn } from "cn";

interface TextFieldProps extends React.ComponentProps<typeof ActionInput> {
  label?: string;
  description?: string;
  error?: string;
  hideLabel?: boolean;
  hideDescription?: boolean;
  hideErrorDescription?: boolean;
  onClick?: () => void;
}

function TextField({
  label,
  description,
  error,
  hideLabel = false,
  hideDescription = false,
  hideErrorDescription = false,
  onClick,
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
    <Field className="gap-4 text-base font-medium" data-invalid={!!error}>
      {label && (
        <FieldLabel
          htmlFor={inputId}
          className={cn("text-foreground", { hidden: hideLabel })}
        >
          {label}
        </FieldLabel>
      )}

      <ActionInput {...sharedInputProps} onClick={onClick} />

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
