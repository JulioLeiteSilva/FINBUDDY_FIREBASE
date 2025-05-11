import { z } from "zod";

export const UpdateBankAccountBalanceSchema = z.object({
  balance: z.number({
    required_error: "O saldo é obrigatório",
    invalid_type_error: "O saldo deve ser um número",
  }),
});

export type UpdateBankAccountBalanceDTO = z.infer<
  typeof UpdateBankAccountBalanceSchema
>;
