import { db } from "../config/firebase";
import { CreditCardRequestDTO } from "../dto/CreditCardRequestDTO";
import { CreditCard } from "../models/CreditCard";
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
    await this.validateCreditCardExists(uid, cardId);

    await CreditCardRepository.update(uid, cardId, data);
  }

  static async delete(uid: string, cardId: string): Promise<void> {
    
    await this.validateCreditCardExists(uid, cardId);

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
