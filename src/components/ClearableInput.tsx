import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./ui/input-group";
import { cn } from "cn";

type ClearableInputProps = React.ComponentProps<"input"> & {
  clearLabel?: string;
  onClear?: () => void;
};

function ClearableInput({
  className,
  clearLabel = "Clear input",
  defaultValue,
  disabled,
  onChange,
  type,
  onClear,
  readOnly,
  ref,
  value,
  ...props
}: ClearableInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const isClearable = String(currentValue ?? "").length > 0 && !disabled && !readOnly;

  function assignRef(node: HTMLInputElement | null) {
    inputRef.current = node;

    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setUncontrolledValue(event.target.value);
    }

    onChange?.(event);
  }

  function handleClear() {
    if (!isControlled) {
      setUncontrolledValue("");
    }

    onClear?.();
    inputRef.current?.focus();
  }

  return (
    <InputGroup
      className={cn(
        "h-14 rounded-full bg-input align-middle",
        "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring",
        "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive",
        className,
      )}
    >
      <InputGroupInput
        ref={assignRef}
        type={type}
        value={currentValue}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
        className="h-full border-none px-4 py-0 text-sm"
        {...props}
      />
      {isClearable && (
        <InputGroupAddon align="inline-end" className="pr-4">
          <InputGroupButton
            aria-label={clearLabel}
            title={clearLabel}
            size="icon-xs"
            className="size-8 rounded-full text-foreground hover:bg-secondary/20 focus-visible:ring-2"
            onClick={handleClear}
          >
            <X aria-hidden="true" className="size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

export default ClearableInput;
