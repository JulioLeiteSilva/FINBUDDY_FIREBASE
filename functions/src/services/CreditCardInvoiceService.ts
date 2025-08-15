import { CreditCardInvoice } from "../models/CreditCardInvoice";
import { CreditCardInvoiceRepository } from "../repositories/CreditCardInvoiceRepository";
import { CreditCardRepository } from "../repositories/CreditCardRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { TransactionService } from "./transaction/TransactionService";
import { InvoiceStatus } from "../enums/InvoiceStatus";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { CreditCard } from "../models/CreditCard";
import { Transaction } from "../models/Transaction";

dayjs.extend(utc);
dayjs.extend(timezone);

export class CreditCardInvoiceService {
  private static readonly ERROR_MESSAGES = {
    INVOICE_NOT_FOUND: "Fatura não encontrada",
    CARD_NOT_FOUND: "Cartão não encontrado",
    CANNOT_EDIT_PAID_INVOICE: "Não é possível editar uma fatura já paga.",
    CANNOT_PAY_OPEN_INVOICE: "Só é possível pagar faturas fechadas.",
  };

  static async create(uid: string, cardId: string, invoice: CreditCardInvoice): Promise<void> {
    await CreditCardInvoiceRepository.create(uid, cardId, invoice);
  }

  static async update(uid: string, cardId: string, invoiceId: string, data: Partial<CreditCardInvoice>): Promise<void> {
    const invoice = await this.getInvoice(uid, cardId, invoiceId);
    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error(this.ERROR_MESSAGES.CANNOT_EDIT_PAID_INVOICE);
    }

    await CreditCardInvoiceRepository.update(uid, cardId, invoiceId, data);
  }

  static async delete(uid: string, cardId: string, invoiceId: string): Promise<void> {
    await CreditCardInvoiceRepository.delete(uid, cardId, invoiceId);
  }

  static async getAll(uid: string, cardId: string): Promise<CreditCardInvoice[]> {
    return await CreditCardInvoiceRepository.getAll(uid, cardId);
  }

  static async payInvoice(uid: string, cardId: string, invoiceId: string, bankAccountId: string): Promise<void> {
    const invoice = await this.getInvoice(uid, cardId, invoiceId);
    if (invoice.status !== InvoiceStatus.CLOSED) {
      throw new Error(this.ERROR_MESSAGES.CANNOT_PAY_OPEN_INVOICE);
    }

    await CreditCardInvoiceRepository.update(uid, cardId, invoiceId, {
      status: InvoiceStatus.PAID,
      bankAccountId,
    });

    const card = await this.getCreditCard(uid, cardId);

    const invoiceTransactions = await this.getInvoiceTransactions(uid, invoiceId, cardId);
    if (invoiceTransactions.length > 0) {
      await TransactionRepository.batchUpdate(
        uid,
        invoiceTransactions.map((t) => ({
          id: t.id,
          data: { isPaid: true },
        }))
      );
    }

    await TransactionService.createIncomeOrExpenseTransaction(uid, {
      name: `FATURA DO MÊS ${invoice.month} DE ${invoice.year} DO CARTAO ${card.name}`,
      category: "Fatura de Cartao de credito",
      value: Number((card.limit - invoice.total).toFixed(2)),
      date: dayjs().tz("America/Sao_Paulo").format("YYYY-MM-DDTHH"),
      type: "EXPENSE",
      isRecurring: false,
      isPaid: true,
      currency: "BRL",
      bankAccountId: bankAccountId,
    });
  }

  static async checkAndUpdateInvoicesStatus(uid: string, cardId: string): Promise<void> {
    const card = await this.getCreditCard(uid, cardId);
    const closingDay = card.closingDay;
    const now = dayjs().tz("America/Sao_Paulo");

    const invoices = await CreditCardInvoiceRepository.getAll(uid, cardId);

    for (const invoice of invoices) {
      if (invoice.status === InvoiceStatus.OPEN) {
        const closingDate = dayjs(
          `${invoice.year}-${String(invoice.month).padStart(2, "0")}-${String(closingDay).padStart(2, "0")}`
        ).tz("America/Sao_Paulo");
        if (now.isAfter(closingDate, "day") || now.isSame(closingDate, "day")) {
          await CreditCardInvoiceRepository.update(uid, cardId, invoice.id, {
            status: InvoiceStatus.CLOSED,
          });
        }
      }
    }
  }

  private static async getInvoice(uid: string, cardId: string, invoiceId: string): Promise<CreditCardInvoice> {
    const invoices = await CreditCardInvoiceRepository.getAll(uid, cardId);
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error(this.ERROR_MESSAGES.INVOICE_NOT_FOUND);
    return invoice;
  }

  private static async getCreditCard(uid: string, cardId: string): Promise<CreditCard> {
    const cards = await CreditCardRepository.getAll(uid);
    const card = cards.find((c) => c.id === cardId);
    if (!card) throw new Error(this.ERROR_MESSAGES.CARD_NOT_FOUND);
    return card;
  }

  private static async getInvoiceTransactions(uid: string, invoiceId: string, cardId: string): Promise<Transaction[]> {
    const allTransactions = await TransactionRepository.getAll(uid);
    return allTransactions.filter((t) => t.invoiceId === invoiceId && t.creditCardId === cardId);
  }
}
