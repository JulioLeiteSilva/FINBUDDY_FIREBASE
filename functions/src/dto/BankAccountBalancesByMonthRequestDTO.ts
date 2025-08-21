import { z } from "zod";
import dayjs from "dayjs";

export const BankAccountBalancesByMonthRequestSchema = z.object({
    month: z.string()
        .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format")
        .refine((month) => {
            const date = dayjs(month, "YYYY-MM");
            return date.isValid();
        }, "Invalid month format"),
});

export type BankAccountBalancesByMonthRequestDTO = z.infer<typeof BankAccountBalancesByMonthRequestSchema>;