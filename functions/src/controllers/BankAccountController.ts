import { z } from "zod";
import { BankAccountService } from "../services/BankAccountService";
import {
  CreateBankAccountDTO,
  CreateBankAccountSchema,
} from "../dto/CreateBankAccountDTO";
import {
  UpdateBankAccountDTO,
  UpdateBankAccountSchema,
} from "../dto/UpdateBankAccountDTO";
import {
  UpdateBankAccountBalanceDTO,
  UpdateBankAccountBalanceSchema,
} from "../dto/UpdateBankAccountBalanceDTO";

export class BankAccountController {
  static async create(uid: string, data: CreateBankAccountDTO) {
    try {
      // Validate incoming data against schema
      const validatedData = CreateBankAccountSchema.parse(data);
      return await BankAccountService.create(uid, validatedData);
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

  static async update(
    uid: string,
    accountId: string,
    data: UpdateBankAccountDTO
  ) {
    if (!accountId) throw new Error("ID da conta é obrigatório");

    try {
      const validatedData = UpdateBankAccountSchema.parse(data);
      return await BankAccountService.update(uid, accountId, validatedData);
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

  static async updateBalance(
    uid: string,
    accountId: string,
    data: UpdateBankAccountBalanceDTO
  ) {
    if (!accountId) throw new Error("ID da conta é obrigatório");

    try {
      const validatedData = UpdateBankAccountBalanceSchema.parse(data);
      return await BankAccountService.updateBalance(
        uid,
        accountId,
        validatedData
      );
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
