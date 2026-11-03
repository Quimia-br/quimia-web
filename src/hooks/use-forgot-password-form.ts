import { useState, type SyntheticEvent } from "react";
import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { z } from "zod";
import { forgotPassword } from "@/services/auth";
import { emailSchema } from "@/utils/validation";
import { AUTH_FIELD_LIMITS } from "@/utils/validation-auth";

const schema = z.object({ email: emailSchema });

export function useForgotPasswordForm(onError: () => void) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { email: "" },
    validators: { onDynamic: schema },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    onSubmit: async ({ value }) => {
      try {
        const normalized = schema.parse(value);
        await forgotPassword(normalized.email);
        setSentTo(normalized.email);
      } catch {
        onError();
      }
    },
  });
  const errors = useSelector(form.store, (state) => ({
    email: state.fieldMeta.email?.errors[0]?.message,
  }));
  const pending = useSelector(form.store, (state) => state.isSubmitting);
  const email = useSelector(form.store, (state) => state.values.email);
  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit();
  }
  return {
    form,
    errors,
    pending,
    sentTo,
    handleSubmit,
    limits: AUTH_FIELD_LIMITS,
    submitDisabled: !email.trim() || pending,
  };
}
