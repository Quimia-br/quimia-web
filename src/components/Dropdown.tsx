import { useId } from "react";
import { Select } from "@base-ui/react/select";
import { cn } from "cn";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type DropdownControlProps = Pick<
  Select.Root.Props<string>,
  | "name"
  | "form"
  | "required"
  | "disabled"
  | "readOnly"
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "open"
  | "defaultOpen"
  | "onOpenChange"
  | "autoComplete"
  | "inputRef"
> &
  Pick<
    Select.Trigger.Props,
    | "id"
    | "aria-label"
    | "aria-labelledby"
    | "aria-describedby"
    | "aria-invalid"
    | "onBlur"
    | "onFocus"
    | "ref"
  > & {
    options: readonly DropdownOption[];
    placeholder?: string;
    className?: string;
  };

export function DropdownControl({
  options,
  placeholder = "Selecione",
  className,
  id,
  onBlur,
  onFocus,
  ref,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...rootProps
}: DropdownControlProps) {
  return (
    <Select.Root<string> {...rootProps} items={options}>
      <Select.Trigger
        ref={ref}
        id={id}
        onBlur={onBlur}
        onFocus={onFocus}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        data-slot="dropdown-trigger"
        className={cn(
          "group/dropdown flex h-[66px] w-full min-w-0 items-center gap-2.5 rounded-full border-0 bg-surface-base py-3 pl-6 pr-3 text-left text-base font-medium leading-none text-foreground-primary outline-none",
          "focus-visible:ring-3 focus-visible:ring-border-focus data-popup-open:ring-3 data-popup-open:ring-border-focus",
          "aria-invalid:ring-3 aria-invalid:ring-destructive data-popup-open:aria-invalid:ring-destructive focus-visible:aria-invalid:ring-destructive disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-foreground-disabled",
          className,
        )}
      >
        <Select.Value
          placeholder={placeholder}
          className="min-w-0 flex-1 truncate data-placeholder:text-text-secondary"
        />
        <Select.Icon
          className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-secondary-primary"
          aria-hidden="true"
        >
          <ChevronUp className="rotate-180 group-data-popup-open/dropdown:hidden dark:invert" />
          <ChevronDown className="hidden rotate-180 group-data-popup-open/dropdown:block dark:invert" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          align="start"
          sideOffset={16}
          alignItemWithTrigger={false}
          className="isolate z-50"
        >
          <Select.Popup
            data-slot="dropdown-popup"
            className="w-[196px] max-w-[var(--available-width)] drop-shadow-[0_0_10px_rgba(0,0,0,0.05)] outline-none"
          >
            <Select.List className="max-h-[min(400px,var(--available-height))] overflow-y-auto overscroll-contain rounded-[32px] outline-none">
              <Select.Group className="flex flex-col gap-4">
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    disabled={option.disabled}
                    className="min-h-[67px] cursor-pointer rounded-[32px] bg-surface-base p-6 text-base font-medium leading-[19px] text-foreground-primary outline-none data-highlighted:bg-secondary-hover data-disabled:cursor-not-allowed data-disabled:text-foreground-disabled"
                  >
                    <Select.ItemText className="block [overflow-wrap:anywhere]">
                      {option.label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

export interface DropdownProps extends DropdownControlProps {
  label: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export default function Dropdown({
  label,
  description,
  error,
  containerClassName,
  ...controlProps
}: DropdownProps) {
  const generatedId = useId();
  const id = controlProps.id ?? `dropdown-${generatedId}`;
  const messageId = error
    ? `${id}-error`
    : description
      ? `${id}-description`
      : undefined;
  const describedBy =
    [controlProps["aria-describedby"], messageId].filter(Boolean).join(" ") ||
    undefined;
  return (
    <Field
      className={cn(
        "group/dropdown-field min-w-0 gap-4 text-base font-medium",
        containerClassName,
      )}
      data-invalid={!!error}
      data-disabled={controlProps.disabled}
    >
      <FieldLabel
        htmlFor={id}
        className="text-base leading-none text-foreground"
      >
        {label}
      </FieldLabel>
      <DropdownControl
        {...controlProps}
        id={id}
        aria-describedby={describedBy}
        aria-invalid={error ? true : controlProps["aria-invalid"]}
      />
      {error ? (
        <FieldError id={messageId}>{error}</FieldError>
      ) : (
        description && (
          <FieldDescription
            id={messageId}
            className="text-base font-medium leading-none text-text-secondary group-has-[[data-popup-open]]/dropdown-field:opacity-0"
          >
            {description}
          </FieldDescription>
        )
      )}
    </Field>
  );
}
