import { db } from "../config/firebase";
import { CreditCardInvoice } from "../models/CreditCardInvoice";

export class CreditCardInvoiceRepository {
  static async create(uid: string, cardId: string, invoice: CreditCardInvoice) {
    await db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc(cardId)
      .collection("invoices")
      .doc(invoice.id)
      .set(invoice);
  }

  static async update(
    uid: string,
    cardId: string,
    invoiceId: string,
    data: Partial<CreditCardInvoice>
  ) {
    await db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc(cardId)
      .collection("invoices")
      .doc(invoiceId)
      .update(data);
  }

  static async delete(uid: string, cardId: string, invoiceId: string) {
    await db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc(cardId)
      .collection("invoices")
      .doc(invoiceId)
      .delete();
  }

  static async getAll(
    uid: string,
    cardId: string
  ): Promise<CreditCardInvoice[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc(cardId)
      .collection("invoices")
      .get();
    return snapshot.docs.map((doc) => doc.data() as CreditCardInvoice);
  }
}
