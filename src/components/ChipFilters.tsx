import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cn } from "cn";
import type { ReactNode } from "react";
import Chip, { ChipAction } from "./Chip";

export interface ChipFilterOption<TValue extends string> {
  value: TValue;
  label: ReactNode;
  disabled?: boolean;
}

export interface ChipFiltersProps<TValue extends string> {
  options: readonly ChipFilterOption<TValue>[];
  value: readonly TValue[];
  onValueChange: (values: TValue[]) => void;
  label?: string;
  clearable?: boolean;
  clearLabel?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-describedby"?: string;
}

function ChipFilters<TValue extends string>({
  options,
  value,
  onValueChange,
  label = "Filtros",
  clearable = false,
  clearLabel = "Limpar filtros",
  disabled = false,
  id,
  className,
  "aria-describedby": describedBy,
}: ChipFiltersProps<TValue>) {
  return (
    <div
      id={id}
      className={cn("flex flex-wrap items-center gap-[18px]", className)}
    >
      <ToggleGroup<TValue>
        multiple
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        aria-label={label}
        aria-describedby={describedBy}
        className="flex min-w-0 flex-wrap items-center gap-[18px]"
      >
        {options.map((option) => (
          <Chip
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </Chip>
        ))}
      </ToggleGroup>
      {clearable && (
        <ChipAction
          onClick={() => onValueChange([])}
          disabled={disabled || value.length === 0}
        >
          {clearLabel}
        </ChipAction>
      )}
    </div>
  );
}

export default ChipFilters;
