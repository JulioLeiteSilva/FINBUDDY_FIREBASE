import { z } from "zod";
import { TransactionFrequency } from "../enums/TransactionFrequency";
import dayjs from "dayjs";

export const TransactionRequestSchema = z
  .object({
    name: z
      .string()
      .min(3, "O nome deve ter no mínimo 3 caracteres")
      .max(100, "O nome deve ter no máximo 100 caracteres"),

    category: z
      .string()
      .min(2, "A categoria deve ter no mínimo 2 caracteres")
      .max(30, "A categoria deve ter no máximo 30 caracteres"),

    value: z
      .number({
        required_error: "O valor é obrigatório",
        invalid_type_error: "O valor deve ser um número",
      })
      .finite("O valor deve ser um número finito"),

    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z)?)?$/,
        "Data deve estar no formato YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.SSSZ"
      ),

    type: z.enum(["INCOME", "EXPENSE", "INVOICE"], {
      errorMap: () => ({ message: "Tipo deve ser INCOME, EXPENSE ou INVOICE" }),
    }),
    invoiceId: z.string().optional(),
    creditCardId: z.string().optional(),

    isRecurring: z.boolean().default(false),

    frequency: z
      .nativeEnum(TransactionFrequency, {
        errorMap: () => ({ message: "Frequência inválida" }),
      })
      .optional()
      .nullable(),

    startDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z)?)?$/,
        "Data inicial deve estar no formato YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.SSSZ"
      )
      .optional()
      .nullable(),

    endDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z)?)?$/,
        "Data final deve estar no formato YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.SSSZ"
      )
      .optional()
      .nullable(),

    isPaid: z.boolean().default(false),

    currency: z
      .string()
      .length(3, "A moeda deve ter exatamente 3 caracteres")
      .regex(
        /^[A-Z]{3}$/,
        "A moeda deve estar no formato ISO 4217 (ex: BRL, USD)"
      ),

    bankAccountId: z.string().min(1, "ID da conta bancária é obrigatório"),
    primaryTransactionId: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring) {
        return data.frequency && data.startDate;
      }
      return true;
    },
    {
      message: "Transações recorrentes precisam de frequência e data inicial",
      path: ["frequency", "startDate"],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = dayjs(data.startDate);
        const end = dayjs(data.endDate);
        const diffInYears = end.diff(start, "year", true);
        return diffInYears <= 1;
      }
      return true;
    },
    {
      message:
        "O período entre data inicial e final não pode ser maior que 1 ano",
      path: ["endDate"],
    }
  );

export type TransactionRequestDTO = z.infer<typeof TransactionRequestSchema>;
