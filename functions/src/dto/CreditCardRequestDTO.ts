import { z } from "zod";
import { CreditCardFlag } from "../enums/CreditCardFlag";

export const CreditCardRequestSchema = z.object({
  name: z.string().min(3).max(100),
  flag: z.nativeEnum(CreditCardFlag),
  closingDay: z.number().int().min(1).max(31),
  dueDate: z.number().int().min(1).max(31),
  limit: z.number().min(0),
  bankAccountId: z.string().min(1),
});

export type CreditCardRequestDTO = z.infer<typeof CreditCardRequestSchema>;