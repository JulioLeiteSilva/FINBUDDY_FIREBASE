import { z } from "zod";
import { AccountType } from "../enums/AccountType";

// Base validation rules
const baseValidation = {
  name: z
    .string()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(50, "O nome deve ter no máximo 50 caracteres"),
  type: z.nativeEnum(AccountType, {
    errorMap: () => ({ message: "Tipo de conta inválido" }),
  }),
  bank: z
    .string()
    .min(2, "O nome do banco deve ter no mínimo 2 caracteres")
    .max(50, "O nome do banco deve ter no máximo 50 caracteres"),
  balance: z
    .number({
      required_error: "O saldo é obrigatório",
      invalid_type_error: "O saldo deve ser um número",
    })
    .finite("O saldo deve ser um número finito"),
  currency: z
    .string()
    .length(3, "A moeda deve ter exatamente 3 caracteres")
    .regex(/^[A-Z]{3}$/, "A moeda deve estar no formato ISO 4217"),
};

// Create DTO
export const CreateBankAccountSchema = z.object(baseValidation);
export type CreateBankAccountDTO = z.infer<typeof CreateBankAccountSchema>;

// Update DTO (all fields optional)
export const UpdateBankAccountSchema = z.object({
  name: baseValidation.name.optional(),
  type: baseValidation.type.optional(),
  bank: baseValidation.bank.optional(),
  balance: baseValidation.balance.optional(),
  currency: baseValidation.currency.optional(),
});
export type UpdateBankAccountDTO = z.infer<typeof UpdateBankAccountSchema>;

// Balance-only update (for transaction adjustments)
export const UpdateBalanceOnlySchema = z.object({
  balance: baseValidation.balance,
});
export type UpdateBalanceOnlyDTO = z.infer<typeof UpdateBalanceOnlySchema>;
