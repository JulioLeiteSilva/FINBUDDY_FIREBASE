import { CreditCardInvoice } from "../models/CreditCardInvoice";
import { CreditCardInvoiceService } from "../services/CreditCardInvoiceService";

export class CreditCardInvoiceController {
  static async create(uid: string, cardId: string, invoice: CreditCardInvoice) {
    await CreditCardInvoiceService.create(uid, cardId, invoice);
  }

  static async update(
    uid: string,
    cardId: string,
    invoiceId: string,
    data: Partial<CreditCardInvoice>
  ) {
    await CreditCardInvoiceService.update(uid, cardId, invoiceId, data);
  }

  static async delete(uid: string, cardId: string, invoiceId: string) {
    await CreditCardInvoiceService.delete(uid, cardId, invoiceId);
  }

  static async getAll(uid: string, cardId: string) {
    return await CreditCardInvoiceService.getAll(uid, cardId);
  }

  static async payInvoice(
    uid: string,
    cardId: string,
    invoiceId: string,
    bankAccountId: string
  ): Promise<void> {
    await CreditCardInvoiceService.payInvoice(
      uid,
      cardId,
      invoiceId,
      bankAccountId
    );
  }
}
