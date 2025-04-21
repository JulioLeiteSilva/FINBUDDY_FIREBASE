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
    return await BankAccountRepository.update(uid, accountId, data);
  }

  static async updateBalance(
    uid: string,
    accountId: string,
    data: UpdateBankAccountBalanceDTO
  ) {
    return await BankAccountRepository.update(uid, accountId, data);
  }

  static async delete(uid: string, accountId: string) {
    return await BankAccountRepository.delete(uid, accountId);
  }

  static async get(uid: string, accountId: string) {
    return await BankAccountRepository.get(uid, accountId);
  }

  static async getAll(uid: string) {
    return await BankAccountRepository.getAll(uid);
  }
}
