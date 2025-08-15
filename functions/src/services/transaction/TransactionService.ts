import { TransactionRequestDTO } from "../../dto/TransactionRequestDTO";
import { SimpleTransactionService } from "./SimpleTransactionService";
import { RecurringTransactionService } from "./RecurringTransactionService";
import { InvoiceTransactionService } from "./InvoiceTransactionService";

export class TransactionService {
    // Orchestrator - delegates to specialized services

    static async createIncomeOrExpenseTransaction(uid: string, data: TransactionRequestDTO) {
        if (!data.isRecurring) {
            return await SimpleTransactionService.create(uid, data);
        }
        return await RecurringTransactionService.create(uid, data);
    }

    static async createInvoiceTransaction(uid: string, data: TransactionRequestDTO) {
        return await InvoiceTransactionService.create(uid, data);
    }

    static async update(uid: string, transactionId: string, data: TransactionRequestDTO): Promise<void> {
        return await SimpleTransactionService.update(uid, transactionId, data);
    }

    static async deleteIncomeOrExpenseTransaction(uid: string, transactionId: string): Promise<void> {
        return await SimpleTransactionService.delete(uid, transactionId);
    }

    static async deleteInvoiceTransaction(uid: string, primaryTransactionId: string): Promise<void> {
        return await InvoiceTransactionService.deleteInvoiceTransaction(uid, primaryTransactionId);
    }

    static async getAllIncomeOrExpense(uid: string) {
        return await SimpleTransactionService.getAllIncomeOrExpense(uid);
    }

    static async getAllInvoices(uid: string) {
        return await InvoiceTransactionService.getAllInvoices(uid);
    }

    static async deleteRecurringTransactions(uid: string, transactionId: string): Promise<void> {
        return await RecurringTransactionService.deleteRecurring(uid, transactionId);
    }

    static async updateInvoiceTransactions(uid: string, data: TransactionRequestDTO): Promise<void> {
        return await InvoiceTransactionService.updateInvoiceTransactions(uid, data);
    }

    static async updateRecurringTransactionGroup(
        uid: string,
        transactionId: string,
        data: Partial<TransactionRequestDTO>
    ): Promise<void> {
        return await RecurringTransactionService.updateRecurringGroup(uid, transactionId, data);
    }

    static async markRecurringTransactionAsPaid(uid: string, transactionId: string): Promise<void> {
        return await RecurringTransactionService.markRecurringTransactionAsPaid(uid, transactionId);
    }

    static async markRecurringTransactionAsUnpaid(uid: string, transactionId: string): Promise<void> {
        return await RecurringTransactionService.markRecurringTransactionAsUnpaid(uid, transactionId);
    }

    static async payInvoiceInstallment(uid: string, transactionId: string): Promise<void> {
        return await InvoiceTransactionService.payInvoiceInstallment(uid, transactionId);
    }
}
