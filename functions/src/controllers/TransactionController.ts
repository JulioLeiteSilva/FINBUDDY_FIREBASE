import { z } from "zod";
import {
  TransactionRequestDTO,
  TransactionRequestSchema,
} from "../dto/TransactionRequestDTO";
import { TransactionService } from "../services/TransactionService";

export class TransactionController {
  static async createTransaction(uid: string, data: TransactionRequestDTO) {
    try {
      const validatedData = TransactionRequestSchema.parse(data);
      return await TransactionService.createTransaction(uid, validatedData);
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

  static async updateIsPaidTransaction(
    uid: string,
    transactionId: string,
    isPaid: boolean
  ) {
    if (!transactionId) throw new Error("não encontrado");

    try {
      return await TransactionService.updateIsPaid(uid, transactionId, isPaid);
    } catch (error) {
      throw error;
    }
  }

  static async deleteTransaction(uid: string, transactionId: string) {
    if (!transactionId) throw new Error("não encontrado");
    return await TransactionService.delete(uid, transactionId);
  }

  static async getAllTransactions(uid: string) {
    return await TransactionService.getAll(uid);
  }

  static async deleteRecurringTransaction(uid: string, transactionId: string) {
    if (!transactionId) throw new Error("não encontrado");
    return await TransactionService.deleteRecurringTransactions(
      uid,
      transactionId
    );
  }
}
