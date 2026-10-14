import ActionInput from "./ActionInput";
import {
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
  FormMessage,
} from "./smoothui/form";

interface FormTextFieldProps extends React.ComponentProps<typeof ActionInput> {
  name: string;
  label: string;
  description?: string;
  onClick?: () => void;
}

function FormInput({
  inputProps,
  hasDescription,
  ...controlProps
}: React.ComponentProps<typeof ActionInput> & {
  inputProps: React.ComponentProps<typeof ActionInput>;
  hasDescription: boolean;
}) {
  // FormControl supplies a description reference even when none is rendered.
  const providerDescriptions = controlProps["aria-describedby"]
    ?.split(/\s+/)
    .filter((id) => hasDescription || !id.endsWith("-form-item-description"));
  const describedBy = [inputProps["aria-describedby"], ...(providerDescriptions ?? [])]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <ActionInput
      {...controlProps}
      {...inputProps}
      id={inputProps.id ?? controlProps.id}
      aria-describedby={describedBy}
      aria-invalid={controlProps["aria-invalid"] ?? inputProps["aria-invalid"]}
    />
  );
}

function FormTextField({
  name,
  label,
  description,
  onClick,
  ...inputProps
}: FormTextFieldProps) {
  return (
    <FormField name={name} className="w-full text-base font-medium">
      <FormLabel {...(inputProps.id ? { htmlFor: inputProps.id } : {})}>{label}</FormLabel>

      <FormControl>
        <FormInput
          inputProps={{ ...inputProps, name, onClick }}
          hasDescription={!!description}
        />
      </FormControl>

      {description && <FormDescription>{description}</FormDescription>}

      <FormMessage />
    </FormField>
  );
}

export default FormTextField;
