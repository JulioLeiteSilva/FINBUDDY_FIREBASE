import { TransactionRequestDTO } from "../dto/TransactionRequestDTO";
import { TransactionService } from "../services/TransactionService";

export class TransactionController {
  static async createTransaction(uid: string, data: TransactionRequestDTO) {
    const res = await TransactionService.createTransaction(uid, data);
    console.log(res);
  }

  static async updateTransaction(
    uid: string,
    transactionId: string,
    data: TransactionRequestDTO
  ) {
    if (!uid) throw new Error("Uid do usuario é obrigatório");
    if (!transactionId) throw new Error("ID da transação é obrigatório");
    if (!data) throw new Error("informaçoes da transação é obrigatório");
    await TransactionService.update(uid, transactionId, data);
  }

  static async updateIsPaidTransaction(
    uid: string,
    transactionId: string,
    isPaid: boolean
  ) {
    if (!uid) throw new Error("Uid do usuario é obrigatório");
    if (!transactionId) throw new Error("ID da transação é obrigatório");
    if (typeof isPaid !== "boolean")
      throw new Error("O campo isPaid deve ser booleano");
    
    await TransactionService.updateIsPaid(uid, transactionId, isPaid);
  }

  static async deleteTransaction(uid: string, transactionId: string) {
    if (!uid) throw new Error("Uid do usuario é obrigatório");
    if (!transactionId) throw new Error("ID da transação é obrigatório");
    await TransactionService.delete(uid, transactionId);
  }
  static async getAllTransactions(uid: string) {
    return await TransactionService.getAll(uid);
  }
}
