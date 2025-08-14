import { CreateBankAccountDTO, CreateBankAccountSchema } from "../dto/BankAccountDTO";
import { UpdateBankAccountDTO, UpdateBankAccountSchema } from "../dto/BankAccountDTO";
import { BankAccountRepository } from "../repositories/BankAccountRepository";
import { BankAccount } from "../models/BankAccount";

export class BankAccountService {
  private static readonly ERROR_MESSAGES = {
    ACCOUNT_NOT_FOUND: "Conta bancária não encontrada",
    ACCOUNT_EXISTS: "Já existe uma conta com este nome",
    HAS_TRANSACTIONS: "Não é possível deletar conta com transações vinculadas",
    INSUFFICIENT_BALANCE: "Saldo insuficiente",
  };
  static async create(uid: string, data: CreateBankAccountDTO): Promise<BankAccount> {
    const validatedData = CreateBankAccountSchema.parse(data);
    const existingAccounts = await BankAccountRepository.getAll(uid);
    const nameExists = existingAccounts.some(
      account => account.name.toLowerCase() === validatedData.name.toLowerCase()
    );

    if (nameExists) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_EXISTS);
    }

    const accountData: BankAccount = {
      ...validatedData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    return await BankAccountRepository.create(uid, accountData);
  }

  static async update(uid: string, accountId: string, data: UpdateBankAccountDTO): Promise<BankAccount> {
    const validatedData = UpdateBankAccountSchema.parse(data);
    const existing = await BankAccountRepository.get(uid, accountId);
    if (!existing) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    if (validatedData.name) {
      const existingAccounts = await BankAccountRepository.getAll(uid);
      const nameExists = existingAccounts.some(
        account =>
          account.id !== accountId &&
          account.name.toLowerCase() === validatedData.name!.toLowerCase()
      );

      if (nameExists) {
        throw new Error(this.ERROR_MESSAGES.ACCOUNT_EXISTS);
      }
    }
    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
    };

    return await BankAccountRepository.update(uid, accountId, updateData);
  }

  static async updateBalance(uid: string, accountId: string, newBalance: number): Promise<BankAccount> {
    const existing = await BankAccountRepository.get(uid, accountId);
    if (!existing) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    return await BankAccountRepository.update(uid, accountId, {
      balance: newBalance,
      updatedAt: new Date(),
    });
  }

  static async delete(uid: string, accountId: string): Promise<void> {
    const existing = await BankAccountRepository.get(uid, accountId);
    if (!existing) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    await BankAccountRepository.delete(uid, accountId);
  }

  static async get(uid: string, accountId: string): Promise<BankAccount> {
    const account = await BankAccountRepository.get(uid, accountId);
    if (!account) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_NOT_FOUND);
    }
    return account;
  }

  static async getAll(uid: string): Promise<BankAccount[]> {
    return await BankAccountRepository.getAll(uid);
  }

  private static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}
