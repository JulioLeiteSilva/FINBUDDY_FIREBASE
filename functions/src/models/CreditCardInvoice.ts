import { InvoiceStatus } from "../enums/InvoiceStatus";
import { Transaction } from "./Transaction";

export interface CreditCardInvoice {
  id: string;
  status: InvoiceStatus;
  total: number;
  transactions: Transaction[];
}
