import { z } from "zod";
import {
  TransactionRequestDTO,
  TransactionRequestSchema,
} from "../dto/TransactionRequestDTO";
import { TransactionService } from "../services/TransactionService";

export class TransactionController {
  static async createIncomeOrExpense(uid: string, data: TransactionRequestDTO) {
    try {
      const validatedData = TransactionRequestSchema.parse(data);
      return await TransactionService.createIncomeOrExpenseTransaction(
        uid,
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
  static async createInvoice(uid: string, data: TransactionRequestDTO) {
    try {
      const validatedData = TransactionRequestSchema.parse(data);
      return await TransactionService.createInvoiceTransaction(
        uid,
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

  static async updateTransaction(
    uid: string,
    transactionId: string,
    data: TransactionRequestDTO
  ) {
    if (!transactionId) throw new Error("não encontrado");

    try {
      const validatedData = TransactionRequestSchema.parse(data);
      return await TransactionService.update(uid, transactionId, validatedData);
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

  static async deleteIncomeOrExpenseTransaction(uid: string, id: string) {
  await TransactionService.deleteIncomeOrExpenseTransaction(uid, id);
}

static async deleteInvoiceTransaction(uid: string, id: string) {
  await TransactionService.deleteInvoiceTransaction(uid, id);
}

  static async getAllIncomeOrExpense(uid: string) {
    return await TransactionService.getAllIncomeOrExpense(uid);
  }
  static async getAllInvoices(uid: string) {
  return await TransactionService.getAllInvoices(uid);
}

  static async deleteRecurringTransaction(uid: string, transactionId: string) {
    if (!transactionId) throw new Error("não encontrado");
    return await TransactionService.deleteRecurringTransactions(
      uid,
      transactionId
    );
  }
}
