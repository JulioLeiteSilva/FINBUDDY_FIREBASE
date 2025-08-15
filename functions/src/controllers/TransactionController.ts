import { TransactionRequestDTO } from "../dto/TransactionRequestDTO";
import { TransactionService } from "../services/transaction/TransactionService";
import { AuthenticatedRequest } from "../utils/routeWrapper";

export class TransactionController {
  static async createIncomeOrExpense(request: AuthenticatedRequest<TransactionRequestDTO>) {
    return await TransactionService.createIncomeOrExpenseTransaction(request.uid, request.data);
  }

  static async createInvoice(request: AuthenticatedRequest<TransactionRequestDTO>) {
    return await TransactionService.createInvoiceTransaction(request.uid, request.data);
  }

  static async updateTransaction(request: AuthenticatedRequest<TransactionRequestDTO & { id: string }>) {
    if (!request.data.id) throw new Error("ID da transação é obrigatório");
    return await TransactionService.update(request.uid, request.data.id, request.data);
  }

  static async updateInvoiceTransactions(request: AuthenticatedRequest<TransactionRequestDTO>) {
    return await TransactionService.updateInvoiceTransactions(request.uid, request.data);
  }

  static async deleteIncomeOrExpenseTransaction(request: AuthenticatedRequest<{ id: string }>) {
    if (!request.data.id) throw new Error("ID da transação é obrigatório");
    await TransactionService.deleteIncomeOrExpenseTransaction(request.uid, request.data.id);
  }

  static async deleteInvoiceTransaction(request: AuthenticatedRequest<{ id: string }>) {
    if (!request.data.id) throw new Error("ID da transação é obrigatório");
    await TransactionService.deleteInvoiceTransaction(request.uid, request.data.id);
  }

  static async getAllIncomeOrExpense(request: AuthenticatedRequest<void>) {
    return await TransactionService.getAllIncomeOrExpense(request.uid);
  }

  static async getAllInvoices(request: AuthenticatedRequest<void>) {
    return await TransactionService.getAllInvoices(request.uid);
  }

  static async deleteRecurringTransaction(request: AuthenticatedRequest<{ id: string }>) {
    if (!request.data.id) throw new Error("ID da transação é obrigatório");
    return await TransactionService.deleteRecurringTransactions(request.uid, request.data.id);
  }

  static async updateRecurringTransactionGroup(
    request: AuthenticatedRequest<Partial<TransactionRequestDTO> & { id: string }>
  ) {
    if (!request.data.id) throw new Error("ID da transação é obrigatório");

    const { id, ...updateData } = request.data;
    return await TransactionService.updateRecurringTransactionGroup(request.uid, id, updateData);
  }

  static async markRecurringTransactionAsPaid(request: AuthenticatedRequest<{ id: string }>) {
    if (!request.data.id) throw new Error("ID da transação é obrigatório");
    return await TransactionService.markRecurringTransactionAsPaid(request.uid, request.data.id);
  }

  static async markRecurringTransactionAsUnpaid(request: AuthenticatedRequest<{ id: string }>) {
    if (!request.data.id) throw new Error("ID da transação é obrigatório");
    return await TransactionService.markRecurringTransactionAsUnpaid(request.uid, request.data.id);
  }

  static async payInvoiceInstallment(request: AuthenticatedRequest<{ id: string }>) {
    if (!request.data.id) throw new Error("ID da transação é obrigatório");
    return await TransactionService.payInvoiceInstallment(request.uid, request.data.id);
  }
}
