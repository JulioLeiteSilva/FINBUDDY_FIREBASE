import { db } from "../config/firebase";
import { CreditCardRequestDTO } from "../dto/CreditCardRequestDTO";
import { CreditCard } from "../models/CreditCard";
import { CreditCardInvoiceRepository } from "../repositories/CreditCardInvoiceRepository";
import { CreditCardRepository } from "../repositories/CreditCardRepository";
import { BankAccountService } from "./BankAccountService";

export class CreditCardService {
  static async create(uid: string, data: CreditCardRequestDTO): Promise<void> {
    const id = db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc().id;
    const creditCard: CreditCard = {
      id,
      ...data,
    };

    await this.validateBankAccountExists(uid, creditCard.bankAccountId);

    await CreditCardRepository.create(uid, creditCard);
  }

  static async update(
    uid: string,
    cardId: string,
    data: Partial<CreditCardRequestDTO>
  ): Promise<void> {
    await this.validateBankAccountExists(uid, data.bankAccountId!);

    const card = await CreditCardRepository.get(uid, cardId);
    if (!card) throw new Error("Cartão de crédito não encontrado");

    if (data.limit !== undefined && data.limit !== card.limit) {
      const diff = data.limit - card.limit;

      // Busca todas as invoices OPEN
      const invoices = await CreditCardInvoiceRepository.getAll(uid, cardId);
      const openInvoices = invoices.filter((i) => i.status === "OPEN");

      // Verifica se alguma ficaria negativa
      for (const invoice of openInvoices) {
        const novoTotal = (invoice.total ?? 0) + diff;
        if (novoTotal < 0) {
          throw new Error(
            `A alteração do limite deixaria a fatura ${invoice.id} com total negativo.`
          );
        }
      }

      // Atualiza os totais das invoices
      for (const invoice of openInvoices) {
        const novoTotal = (invoice.total ?? 0) + diff;
        await CreditCardInvoiceRepository.update(uid, cardId, invoice.id, {
          total: novoTotal,
        });
      }
    }

    await CreditCardRepository.update(uid, cardId, data);
  }

  static async delete(uid: string, cardId: string): Promise<void> {
    await this.validateCreditCardExists(uid, cardId);

    // Busca o cartão para pegar o limite atual
    const card = await CreditCardRepository.get(uid, cardId);
    if (!card) throw new Error("Cartão de crédito não encontrado");

    // Busca todas as invoices do cartão
    const invoices = await CreditCardInvoiceRepository.getAll(uid, cardId);

    // Verifica se alguma invoice tem total diferente do limite do cartão
    const invoiceComTotalDiferente = invoices.find(
      (invoice) => Number(invoice.total ?? 0) !== Number(card.limit)
    );
    if (invoiceComTotalDiferente) {
      throw new Error(
        `Não é possível excluir o cartão: existe fatura (${invoiceComTotalDiferente.id}) com total diferente do limite do cartão.`
      );
    }

    await CreditCardRepository.delete(uid, cardId);
  }

  static async getAll(uid: string): Promise<CreditCard[]> {
    return await CreditCardRepository.getAll(uid);
  }

  private static async validateBankAccountExists(
    uid: string,
    bankAccountId: string
  ): Promise<void> {
    const bankAccount = await BankAccountService.get(uid, bankAccountId);
    if (!bankAccount) {
      throw new Error("não encontrado");
    }
  }

  private static async validateCreditCardExists(
    uid: string,
    cardId: string
  ): Promise<void> {
    const card = await CreditCardRepository.get(uid, cardId);
    if (!card) throw new Error("Cartão de crédito não encontrado");
  }
}
