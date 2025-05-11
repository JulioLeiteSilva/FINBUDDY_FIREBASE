import { db } from "../config/firebase";
import { CreateBankAccountDTO } from "../dto/CreateBankAccountDTO";
import { UpdateBankAccountBalanceDTO } from "../dto/UpdateBankAccountBalanceDTO";
import { UpdateBankAccountDTO } from "../dto/UpdateBankAccountDTO";
import { BankAccountRepository } from "../repositories/BankAccountRepository";

export class BankAccountService {
  static async create(uid: string, data: CreateBankAccountDTO) {
    const id = db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .doc().id;
    return await BankAccountRepository.create(uid, { ...data, id });
  }

  static async update(
    uid: string,
    accountId: string,
    data: UpdateBankAccountDTO
  ) {
    try {
      const result = await BankAccountRepository.update(uid, accountId, data);
      if (!result) {
        throw new Error("Erro ao atualizar conta bancária");
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async updateBalance(
    uid: string,
    accountId: string,
    data: UpdateBankAccountBalanceDTO
  ) {
    try {
      const result = await BankAccountRepository.update(uid, accountId, data);
      if (!result) {
        throw new Error("Erro ao atualizar saldo da conta bancária");
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async delete(uid: string, accountId: string) {
    return await BankAccountRepository.delete(uid, accountId);
  }

  static async get(uid: string, accountId: string) {
    try {
      const result = await BankAccountRepository.get(uid, accountId);
      if (!result) {
        throw new Error("Conta bancária não encontrada");
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(uid: string) {
    return await BankAccountRepository.getAll(uid);
  }
}
