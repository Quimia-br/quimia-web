import { z } from "zod"

export function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
}

export function isValidCNPJ(cnpj: string): boolean {
  const value = cnpj.replace(/\D/g, "")

  if (value.length !== 14) return false
  if (/^(\d)\1+$/.test(value)) return false

  const calculateDigit = (
    base: string,
    weights: number[],
  ) => {
    const sum = base
      .split("")
      .reduce(
        (acc, digit, index) =>
          acc + Number(digit) * weights[index],
        0,
      )

    const remainder = sum % 11

    return remainder < 2 ? 0 : 11 - remainder
  }

  const firstDigit = calculateDigit(
    value.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )

  const secondDigit = calculateDigit(
    value.slice(0, 12) + firstDigit,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )

  return (
    value ===
    `${value.slice(0, 12)}${firstDigit}${secondDigit}`
  )
}

export const cnpjSchema = z
  .string()
  .min(1, "CNPJ é obrigatório")
  .refine(isValidCNPJ, {
    message: "CNPJ inválido",
  })
