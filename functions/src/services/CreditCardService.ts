import { z } from "zod";
import { db } from "../config/firebase";
import { CreditCardRequestDTO, CreditCardRequestSchema } from "../dto/CreditCardRequestDTO";
import { CreditCardRepository } from "../repositories/CreditCardRepository";
import { CreditCardInvoiceRepository } from "../repositories/CreditCardInvoiceRepository";
import { BankAccountService } from "./BankAccountService";
import { CreditCard } from "../models/CreditCard";

export class CreditCardService {
  private static readonly ERROR_MESSAGES = {
    CARD_NOT_FOUND: "Cartão de crédito não encontrado",
    BANK_ACCOUNT_NOT_FOUND: "Conta bancária não encontrada",
    LIMIT_CHANGE_NEGATIVE_TOTAL: "A alteração do limite deixaria uma fatura com total negativo",
    CANNOT_DELETE_CARD_WITH_TRANSACTIONS: "Não é possível excluir o cartão: existe fatura com total diferente do limite do cartão",
  };

  static async create(uid: string, data: CreditCardRequestDTO): Promise<CreditCard> {
    const validatedData = this.validateCreditCardData(data);
    await this.validateBankAccountExists(uid, validatedData.bankAccountId);

    const id = db
      .collection("users")
      .doc(uid)
      .collection("creditCards")
      .doc().id;

    const creditCard: CreditCard = {
      id,
      ...validatedData,
    };

    await CreditCardRepository.create(uid, creditCard);
    return creditCard;
  }

  static async update(uid: string, cardId: string, data: Partial<CreditCardRequestDTO>): Promise<void> {
    const validatedData = this.validatePartialCreditCardData(data);

    if (validatedData.bankAccountId) {
      await this.validateBankAccountExists(uid, validatedData.bankAccountId);
    }

    const card = await CreditCardRepository.get(uid, cardId);
    if (!card) throw new Error(this.ERROR_MESSAGES.CARD_NOT_FOUND);
    if (validatedData.limit !== undefined && validatedData.limit !== card.limit) {
      await this.handleLimitChange(uid, cardId, card.limit, validatedData.limit);
    }

    await CreditCardRepository.update(uid, cardId, validatedData);
  }
  static async delete(uid: string, cardId: string): Promise<void> {
    await this.validateCreditCardExists(uid, cardId);

    const card = await CreditCardRepository.get(uid, cardId);
    if (!card) throw new Error(this.ERROR_MESSAGES.CARD_NOT_FOUND);

    await this.validateCardCanBeDeleted(uid, cardId, card.limit);
    await CreditCardRepository.delete(uid, cardId);
  }

  static async getAll(uid: string): Promise<CreditCard[]> {
    return await CreditCardRepository.getAll(uid);
  }

  static async get(uid: string, cardId: string): Promise<CreditCard> {
    const card = await CreditCardRepository.get(uid, cardId);
    if (!card) throw new Error(this.ERROR_MESSAGES.CARD_NOT_FOUND);
    return card;
  }

  private static validateCreditCardData(data: CreditCardRequestDTO): CreditCardRequestDTO {
    try {
      return CreditCardRequestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
      }
      throw error;
    }
  }

  private static validatePartialCreditCardData(data: Partial<CreditCardRequestDTO>): Partial<CreditCardRequestDTO> {
    try {
      return CreditCardRequestSchema.partial().parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
      }
      throw error;
    }
  }

  private static async handleLimitChange(uid: string, cardId: string, oldLimit: number, newLimit: number): Promise<void> {
    const diff = newLimit - oldLimit;

    const invoices = await CreditCardInvoiceRepository.getAll(uid, cardId);
    const openInvoices = invoices.filter((i) => i.status === "OPEN");

    for (const invoice of openInvoices) {
      const newTotal = (invoice.total ?? 0) + diff;
      if (newTotal < 0) {
        throw new Error(`${this.ERROR_MESSAGES.LIMIT_CHANGE_NEGATIVE_TOTAL}: Fatura ${invoice.month}/${invoice.year}`);
      }
    }

    for (const invoice of openInvoices) {
      const newTotal = (invoice.total ?? 0) + diff;
      await CreditCardInvoiceRepository.update(uid, cardId, invoice.id, {
        total: newTotal,
      });
    }
  }

  private static async validateCardCanBeDeleted(uid: string, cardId: string, cardLimit: number): Promise<void> {
    const invoices = await CreditCardInvoiceRepository.getAll(uid, cardId);

    const invoiceWithDifferentTotal = invoices.find(
      (invoice) => Number(invoice.total ?? 0) !== Number(cardLimit)
    );

    if (invoiceWithDifferentTotal) {
      throw new Error(
        `${this.ERROR_MESSAGES.CANNOT_DELETE_CARD_WITH_TRANSACTIONS}: Fatura ${invoiceWithDifferentTotal.month}/${invoiceWithDifferentTotal.year}`
      );
    }
  }

  private static async validateBankAccountExists(uid: string, bankAccountId: string): Promise<void> {
    const bankAccount = await BankAccountService.get(uid, bankAccountId);
    if (!bankAccount) {
      throw new Error(this.ERROR_MESSAGES.BANK_ACCOUNT_NOT_FOUND);
    }
  }

  private static async validateCreditCardExists(uid: string, cardId: string): Promise<void> {
    const card = await CreditCardRepository.get(uid, cardId);
    if (!card) throw new Error(this.ERROR_MESSAGES.CARD_NOT_FOUND);
  }
}
