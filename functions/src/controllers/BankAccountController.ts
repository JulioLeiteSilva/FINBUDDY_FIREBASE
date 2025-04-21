import { BankAccountService } from "../services/BankAccountService";
import { CreateBankAccountDTO } from "../dto/CreateBankAccountDTO";
import { UpdateBankAccountDTO } from "../dto/UpdateBankAccountDTO";
import { UpdateBankAccountBalanceDTO } from "../dto/UpdateBankAccountBalanceDTO";

export class BankAccountController {
  static async create(uid: string, data: CreateBankAccountDTO) {
    if (!data.name || !data.type || !data.bank || !data.currency) {
      throw new Error("Todos os campos obrigatórios devem ser preenchidos");
    }
    return await BankAccountService.create(uid, data);
  }

  static async update(
    uid: string,
    accountId: string,
    data: UpdateBankAccountDTO
  ) {
    if (!accountId) throw new Error("ID da conta é obrigatório");
    return await BankAccountService.update(uid, accountId, data);
  }

  static async updateBalance(
    uid: string,
    accountId: string,
    data: UpdateBankAccountBalanceDTO
  ) {
    if (!accountId || data.balance === undefined) {
      throw new Error("ID da conta e novo saldo são obrigatórios");
    }
    return await BankAccountService.updateBalance(uid, accountId, data);
  }

  static async delete(uid: string, accountId: string) {
    if (!accountId) throw new Error("ID da conta é obrigatório");
    return await BankAccountService.delete(uid, accountId);
  }

  static async get(uid: string, accountId: string) {
    if (!accountId) throw new Error("ID da conta é obrigatório");
    return await BankAccountService.get(uid, accountId);
  }

  static async getAll(uid: string) {
    return await BankAccountService.getAll(uid);
  }
}
