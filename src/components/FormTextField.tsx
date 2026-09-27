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

function FormTextField({
  name,
  label,
  description,
  onClick,
  ...inputProps
}: FormTextFieldProps) {
  return (
    <FormField name={name} className="text-base font-medium">
      <FormLabel>{label}</FormLabel>

      <FormControl>
        <ActionInput {...inputProps} onClick={onClick} />
      </FormControl>

      {description && <FormDescription>{description}</FormDescription>}

      <FormMessage />
    </FormField>
  );
}

export default FormTextField;
