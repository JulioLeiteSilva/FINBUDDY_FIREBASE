import { z } from "zod";
import { AccountType } from "../enums/AccountType";

export const UpdateBankAccountSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(50, "O nome deve ter no máximo 50 caracteres")
    .optional(),
  type: z
    .nativeEnum(AccountType, {
      errorMap: () => ({ message: "Tipo de conta inválido" }),
    })
    .optional(),
  bank: z
    .string()
    .min(2, "O nome do banco deve ter no mínimo 2 caracteres")
    .max(50, "O nome do banco deve ter no máximo 50 caracteres")
    .optional(),
  currency: z
    .string()
    .length(3, "A moeda deve ter exatamente 3 caracteres")
    .regex(
      /^[A-Z]{3}$/,
      "A moeda deve estar no formato ISO 4217 (ex: BRL, USD)"
    )
    .optional(),
});

export type UpdateBankAccountDTO = z.infer<typeof UpdateBankAccountSchema>;
