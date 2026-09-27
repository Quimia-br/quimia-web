import React, { useRef, useState, useImperativeHandle } from "react";
import { Eye, EyeClosed, X } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./ui/input-group";
import { cn } from "cn";

interface ActionInputProps extends React.ComponentPropsWithoutRef<"input"> {
  clickLabel?: string;
  clearLabel?: string;
  onClick?: () => void;
  onClear?: () => void;
}

interface InputActionProps {
  clearLabel: string;
  isClearable: boolean;
  isPasswordToggleable: boolean;
  onClear: () => void;
  onTogglePassword: () => void;
  showPassword: boolean;
}

function InputAction({
  clearLabel,
  isClearable,
  isPasswordToggleable,
  onClear,
  onTogglePassword,
  showPassword,
}: InputActionProps) {
  if (isPasswordToggleable) {
    const passwordLabel = showPassword ? "Hide password" : "Show password";

    return (
      <InputGroupAddon align="inline-end" className="pr-4">
        <InputGroupButton
          aria-label={passwordLabel}
          className="rounded-full size-8 text-foreground hover:bg-secondary/20 focus-visible:ring-2"
          onClick={onTogglePassword}
          size="icon-xs"
          title={passwordLabel}
          type="button"
        >
          {showPassword ? (
            <EyeClosed aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </InputGroupButton>
      </InputGroupAddon>
    );
  }

  if (!isClearable) return null;

  return (
    <InputGroupAddon align="inline-end" className="pr-4">
      <InputGroupButton
        aria-label={clearLabel}
        className="rounded-full size-8 text-foreground hover:bg-secondary/20 focus-visible:ring-2"
        onClick={onClear}
        size="icon-xs"
        title={clearLabel}
        type="button"
      >
        <X aria-hidden="true" className="size-4" />
      </InputGroupButton>
    </InputGroupAddon>
  );
}

const ActionInput = React.forwardRef<HTMLInputElement, ActionInputProps>(
  (
    {
      className,
      clearLabel,
      clickLabel,
      defaultValue,
      disabled,
      onChange,
      onClear,
      type,
      onClick,
      readOnly,
      value,
      ...props
    },
    forwardedRef
  ) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolledValue;
    const hasText = String(currentValue ?? "").length > 0;

    const isClearable = hasText && !disabled && !readOnly && type !== "password";
    const isPasswordToggleable = type === "password" && !disabled && !readOnly;

    const [showPassword, setShowPassword] = useState(false);
    const computedType = type === "password" && showPassword ? "text" : type;
    const resolvedClearLabel = clearLabel ?? clickLabel ?? "Clear input";

    useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      if (!isControlled) {
        setUncontrolledValue(event.target.value);
      }
      onChange?.(event);
    }

    function handleTogglePassword() {
      setShowPassword((prev) => !prev);

      queueMicrotask(() => {
        const input = inputRef.current;
        if (input) {
          input.focus();
          const length = input.value.length;
          input.setSelectionRange(length, length);
        }
      });
    }

    function handleClear() {
      if (!isControlled) {
        setUncontrolledValue("");
      }

      if (isControlled && onChange) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set;

        if (nativeInputValueSetter && inputRef.current) {
          nativeInputValueSetter.call(inputRef.current, "");
          const event = new Event("input", { bubbles: true });
          inputRef.current.dispatchEvent(event);
        }
      }

      onClear?.();
      onClick?.();
      inputRef.current?.focus();
    }

    return (
      <InputGroup
        className={cn(
          "h-12 rounded-full bg-input align-middle",
          "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring",
          "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive",
          className
        )}
      >
        <InputGroupInput
          ref={inputRef}
          type={computedType}
          value={currentValue}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          className="h-full py-0 pl-6 pr-4 text-sm border-none"
          {...props}
        />
        <InputAction
          clearLabel={resolvedClearLabel}
          isClearable={isClearable}
          isPasswordToggleable={isPasswordToggleable}
          onClear={handleClear}
          onTogglePassword={handleTogglePassword}
          showPassword={showPassword}
        />
      </InputGroup>
    );
  }
);

ActionInput.displayName = "ActionInput";

export default ActionInput;
