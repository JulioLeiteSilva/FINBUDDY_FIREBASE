import { InvoiceStatus } from "../enums/InvoiceStatus";


export interface CreditCardInvoice {
  id: string;
  status: InvoiceStatus;
  total: number;
  month: number;
  year: number;
  bankAccountId?: string | null;
}
