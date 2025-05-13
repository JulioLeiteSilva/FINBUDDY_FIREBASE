import { FinancialObjective } from "../enums/FinancialObjective";
import { z } from "zod";

export const CompleteUserProfileSchema = z.object({
  cellphone: z
    .string()
    .min(10, "O telefone deve ter no mínimo 10 dígitos")
    .max(11, "O telefone deve ter no máximo 11 dígitos")
    .regex(/^\d+$/, "O telefone deve conter apenas números"),

  address: z
    .string()
    .min(5, "O endereço deve ter no mínimo 5 caracteres")
    .max(200, "O endereço deve ter no máximo 200 caracteres"),

  birthDate: z
    .string()
    .regex(
      /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
      "Data de nascimento deve estar no formato DD/MM/YYYY"
    ),

  CPF: z
    .string()
    .length(11, "O CPF deve ter exatamente 11 dígitos")
    .regex(/^\d+$/, "O CPF deve conter apenas números"),

  financialObjective: z
    .nativeEnum(FinancialObjective)
    .describe("Objetivo financeiro"),
});

export type CompleteUserProfileDTO = z.infer<typeof CompleteUserProfileSchema>;
