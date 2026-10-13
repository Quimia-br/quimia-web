import { useForm } from "@tanstack/react-form";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Form from "./smoothui/form";
import FormTextField from "./FormTextField";

describe("FormTextField", () => {
  it("links the label, guidance and external field error through the real provider", () => {
    render(<Form errors={{ email: "Email is required" }}><FormTextField name="email" label="Email" description="Use your work email" /></Form>);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Use your work email Email is required");
    expect(screen.getByRole("alert")).toHaveTextContent("Email is required");
  });

  it("includes its named value in native FormData", () => {
    const { container } = render(<Form><FormTextField name="company" label="Company" defaultValue="Quimia" /></Form>);
    const form = container.querySelector("form")!;
    expect(new FormData(form).get("company")).toBe("Quimia");
  });

  it("preserves custom IDs and external guidance alongside provider messages", () => {
    render(<><p id="external-help">Company account</p><Form errors={{ email: "Invalid email" }}><FormTextField id="work-email" name="email" label="Email" description="Use your work email" aria-describedby="external-help" /></Form></>);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("id", "work-email");
    expect(input).toHaveAccessibleDescription("Company account Use your work email Invalid email");
  });

  it("does not point at a missing description when no guidance is supplied", () => {
    render(<Form><FormTextField name="company" label="Company" /></Form>);
    expect(screen.getByRole("textbox", { name: "Company" })).not.toHaveAttribute("aria-describedby");
  });

  it("announces an error without guidance and removes its reference when the error is cleared", async () => {
    const { rerender } = render(<Form errors={{ company: "Company is required" }}><FormTextField name="company" label="Company" /></Form>);
    const input = screen.getByRole("textbox", { name: "Company" });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Company is required");
    const references = input.getAttribute("aria-describedby")!.split(/\s+/);
    for (const id of references) expect(document.getElementById(id)).not.toBeNull();

    rerender(<Form><FormTextField name="company" label="Company" /></Form>);
    expect(input).not.toBeInvalid();
    expect(input).not.toHaveAttribute("aria-describedby");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("updates and clears a TanStack field through real input events and submits the current value", async () => {
    const user = userEvent.setup();
    const submissions: string[] = [];
    function CompanyForm() {
      const form = useForm({ defaultValues: { company: "Quimia" }, onSubmit: ({ value }) => { submissions.push(value.company); } });
      return <Form onFormSubmit={(event) => { event.preventDefault(); void form.handleSubmit(); }}>
        <form.Field name="company">{(field) => <FormTextField name={field.name} label="Company" value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} onBlur={field.handleBlur} />}</form.Field>
        <form.Subscribe selector={(state) => state.values.company}>{(value) => <output aria-label="Current company">{value || "Empty"}</output>}</form.Subscribe>
        <button type="submit">Save</button>
      </Form>;
    }
    render(<CompanyForm />);
    await user.click(screen.getByRole("button", { name: "Clear input" }));
    expect(screen.getByLabelText("Current company")).toHaveTextContent("Empty");
    await user.type(screen.getByRole("textbox", { name: "Company" }), "Acme");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(submissions).toEqual(["Acme"]));
  });
});
