import { CreditCardInvoice } from "../models/CreditCardInvoice";
import { CreditCardInvoiceService } from "../services/CreditCardInvoiceService";
import { AuthenticatedRequest } from "../utils/routeWrapper";

export class CreditCardInvoiceController {
  static async create(request: AuthenticatedRequest<{ cardId: string; invoice: CreditCardInvoice }>) {
    const { uid, data } = request;
    await CreditCardInvoiceService.create(uid, data.cardId, data.invoice);
  }

  static async update(request: AuthenticatedRequest<{ cardId: string; invoiceId: string; data: Partial<CreditCardInvoice> }>) {
    const { uid, data } = request;
    await CreditCardInvoiceService.update(uid, data.cardId, data.invoiceId, data.data);
  }

  static async delete(request: AuthenticatedRequest<{ cardId: string; invoiceId: string }>) {
    const { uid, data } = request;
    await CreditCardInvoiceService.delete(uid, data.cardId, data.invoiceId);
  }

  static async getAll(request: AuthenticatedRequest<{ cardId: string }>) {
    const { uid, data } = request;
    return await CreditCardInvoiceService.getAll(uid, data.cardId);
  }

  static async payInvoice(request: AuthenticatedRequest<{ cardId: string; invoiceId: string; bankAccountId: string }>) {
    const { uid, data } = request;
    await CreditCardInvoiceService.payInvoice(uid, data.cardId, data.invoiceId, data.bankAccountId);
  }
}
