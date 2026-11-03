import { describe, expect, it } from "vite-plus/test";
import { cnpjSchema, formatCNPJ, isValidCNPJ } from "@/lib/utils/formatCnpj";

describe("CNPJ formatting", () => {
  it.each([
    ["", ""],
    ["abc", ""],
    ["123", "12.3"],
    ["123456", "12.345.6"],
    ["123456789", "12.345.678/9"],
    ["1234567890123", "12.345.678/9012-3"],
    ["a11.222.333/0001-81z", "11.222.333/0001-81"],
    ["11222333000181999", "11.222.333/0001-81"],
  ])("formats %j as %j", (input, expected) => {
    expect(formatCNPJ(input)).toBe(expected);
  });
});

describe("CNPJ validation", () => {
  it.each(["11222333000181", "11.222.333/0001-81", "04.252.011/0001-10", "00.000.000/0001-91"])(
    "accepts valid check digits in %s",
    (input) => {
      expect(isValidCNPJ(input)).toBe(true);
    },
  );

  it.each([
    "",
    "1122233300018",
    "112223330001811",
    "00000000000000",
    "11111111111111",
    "11222333000191",
    "11.222.333/0001-82",
  ])("rejects invalid length, repeated digits or checksum in %j", (input) => {
    expect(isValidCNPJ(input)).toBe(false);
  });

  it("allows a formatted CNPJ through the registration schema", () => {
    expect(cnpjSchema.parse("11.222.333/0001-81")).toBe("11.222.333/0001-81");
  });

  it.each(["", "11.222.333/0001-82", "11.222", undefined, 11222333000181])(
    "prevents invalid registration input %j",
    (input) => {
      expect(cnpjSchema.safeParse(input).success).toBe(false);
    },
  );
});
