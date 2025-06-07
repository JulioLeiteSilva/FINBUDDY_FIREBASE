import dayjs from "dayjs";
import { InvoiceStatus } from "../enums/InvoiceStatus";
import { CreditCardInvoice } from "../models/CreditCardInvoice";
import { CreditCardInvoiceRepository } from "../repositories/CreditCardInvoiceRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { CreditCardRepository } from "../repositories/CreditCardRepository";
import { TransactionService } from "./TransactionService";

export class CreditCardInvoiceService {
  static async create(
    uid: string,
    cardId: string,
    invoice: CreditCardInvoice
  ): Promise<void> {
    await CreditCardInvoiceRepository.create(uid, cardId, invoice);
  }

  static async update(
    uid: string,
    cardId: string,
    invoiceId: string,
    data: Partial<CreditCardInvoice>
  ): Promise<void> {
    const invoices = await CreditCardInvoiceRepository.getAll(uid, cardId);
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error("Fatura não encontrada");
    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error("Não é possível editar uma fatura já paga.");
    }

    await CreditCardInvoiceRepository.update(uid, cardId, invoiceId, data);
  }

  static async delete(
    uid: string,
    cardId: string,
    invoiceId: string
  ): Promise<void> {
    await CreditCardInvoiceRepository.delete(uid, cardId, invoiceId);
  }

  static async getAll(
    uid: string,
    cardId: string
  ): Promise<CreditCardInvoice[]> {
    return await CreditCardInvoiceRepository.getAll(uid, cardId);
  }

  static async payInvoice(
    uid: string,
    cardId: string,
    invoiceId: string,
    bankAccountId: string
  ): Promise<void> {
    // Busca a fatura
    const invoices = await CreditCardInvoiceRepository.getAll(uid, cardId);
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) throw new Error("Fatura não encontrada");
    if (invoice.status !== InvoiceStatus.CLOSED) {
      throw new Error("Só é possível pagar faturas fechadas.");
    }

    // Atualiza status para PAID e grava bankAccountId
    await CreditCardInvoiceRepository.update(uid, cardId, invoiceId, {
      status: InvoiceStatus.PAID,
      bankAccountId,
    });

    // Busca o cartão de crédito
    const cards = await CreditCardRepository.getAll(uid);
    const card = cards.find((c) => c.id === cardId);
    if (!card) throw new Error("Cartão não encontrado");

    // Busca todas as transações dessa fatura
    const allTransactions = await TransactionRepository.getAll(uid);
    const invoiceTransactions = allTransactions.filter(
      (t) => t.invoiceId === invoiceId && t.creditCardId === cardId
    );

    // Marca todas as transações da fatura como pagas (isPaid: true), sem mexer no balanço
    if (invoiceTransactions.length > 0) {
      await TransactionRepository.batchUpdate(
        uid,
        invoiceTransactions.map((t) => ({
          id: t.id,
          data: { isPaid: true },
        }))
      );
    }

    // Cria transação de despesa referente ao pagamento da fatura
    await TransactionService.createIncomeOrExpenseTransaction(uid, {
      name: `FATURA DO MÊS ${invoice.month} DE ${invoice.year} DO CARTAO ${card.name}`,
      category: "Fatura de Cartao de credito",
      value: invoice.total,
      date: dayjs().toISOString(),
      type: "EXPENSE",
      isRecurring: false,
      isPaid: true,
      currency: "BRL", // ou card.currency se existir
      bankAccountId: bankAccountId,
    });
  }

  static async checkAndUpdateInvoicesStatus(uid: string, cardId: string): Promise<void> {
    const cards = await CreditCardRepository.getAll(uid);
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const closingDay = card.closingDay;
    const now = dayjs().tz("America/Sao_Paulo");

    const invoices = await CreditCardInvoiceRepository.getAll(uid, cardId);

    for (const invoice of invoices) {
      if (invoice.status === InvoiceStatus.OPEN) {
        // Calcula a data de fechamento da fatura
        const closingDate = dayjs(`${invoice.year}-${String(invoice.month).padStart(2, "0")}-${String(closingDay).padStart(2, "0")}`).tz("America/Sao_Paulo");
        if (now.isAfter(closingDate, "day") || now.isSame(closingDate, "day")) {
          await CreditCardInvoiceRepository.update(uid, cardId, invoice.id, { status: InvoiceStatus.CLOSED });
        }
      }
    }
  }
}
