import { TransactionFrequency } from "../enums/TransactionFrequency";

export interface TransactionRequestDTO {
  name: string;
  category: string;
  value: number;
  date: Date;
  type: "INCOME" | "EXPENSE";
  isRecurring: boolean;
  frequency?: TransactionFrequency;
  startDate?: Date;
  endDate?: Date;
  isPaid: boolean;
  currency: string;
  bankAccountId: string;
}
