import { CreditCardInvoice } from "./CreditCardInvoice";

export interface CreditCard {
  id: string;
  name: string;
  flag: string;
  closingDay: number;
  dueDate: number;
  limit: number;
  invoice: CreditCardInvoice[];
  currentBalance: number;
}
