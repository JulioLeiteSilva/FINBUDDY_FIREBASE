import { TransactionFrequency } from "../enums/TransactionFrequency";

export interface Transaction {
  id: string;
  name: string;
  category: string;
  value: number;
  date: Date;
  type: "INCOME" | "EXPENSE" | "INVOICE"; 
  isRecurring: boolean;
  frequency?: TransactionFrequency;
  startDate?: Date;
  endDate?: Date;
  isPaid: boolean;
  currency: string;
  bankAccountId: string;
  invoiceId?: string;
  creditCardId?: string;
  primaryTransactionId?: string | null;
}
