import { DropdownControl, type DropdownControlProps } from "@/components/Dropdown";
import {
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/smoothui/form";

interface FormDropdownProps extends DropdownControlProps {
  name: string;
  label: string;
  description?: string;
}

function FormDropdownControl({
  inputProps,
  hasDescription,
  ...controlProps
}: Partial<DropdownControlProps> & { inputProps: DropdownControlProps; hasDescription: boolean }) {
  const formDescriptions = controlProps["aria-describedby"]
    ?.split(/\s+/)
    .filter((id) => hasDescription || !id.endsWith("-form-item-description"));
  const describedBy =
    [inputProps["aria-describedby"], ...(formDescriptions ?? [])].filter(Boolean).join(" ") ||
    undefined;
  return (
    <DropdownControl
      {...controlProps}
      {...inputProps}
      id={inputProps.id ?? controlProps.id}
      aria-describedby={describedBy}
      aria-invalid={controlProps["aria-invalid"] ?? inputProps["aria-invalid"]}
    />
  );
}

export default function FormDropdown({ name, label, description, ...props }: FormDropdownProps) {
  return (
    <FormField
      name={name}
      className="group/dropdown-field w-full gap-4 text-base font-medium [&>div]:gap-4 [&>div>div:empty]:hidden"
    >
      <FormLabel className="text-base" {...(props.id ? { htmlFor: props.id } : {})}>
        {label}
      </FormLabel>
      <FormControl>
        <FormDropdownControl inputProps={{ ...props, name }} hasDescription={!!description} />
      </FormControl>
      {description && (
        <FormDescription className="text-base font-medium leading-none text-text-secondary group-has-[[data-popup-open]]/dropdown-field:opacity-0">
          {description}
        </FormDescription>
      )}
      <FormMessage />
    </FormField>
  );
}
