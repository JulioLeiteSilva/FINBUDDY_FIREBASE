import { createAuthenticatedRoute } from "../utils/routeWrapper";
import { TransactionController } from "../controllers/TransactionController";
import { TransactionRequestDTO } from "../dto/TransactionRequestDTO";

export const transactionRoutes = {
  createIncomeOrExpense: createAuthenticatedRoute<TransactionRequestDTO, void>(
    TransactionController.createIncomeOrExpense,
    {
      successMessage: "Transação criada com sucesso",
      requireData: true,
    }
  ),

  createInvoice: createAuthenticatedRoute<TransactionRequestDTO, void>(
    TransactionController.createInvoice,
    {
      successMessage: "Transação de fatura criada com sucesso",
      requireData: true,
    }
  ),

  updateTransaction: createAuthenticatedRoute<TransactionRequestDTO & { id: string }, void>(
    TransactionController.updateTransaction,
    {
      successMessage: "Transação atualizada com sucesso",
      requireData: true,
    }
  ),

  updateInvoiceTransactions: createAuthenticatedRoute<TransactionRequestDTO, void>(
    TransactionController.updateInvoiceTransactions,
    {
      successMessage: "Transações de fatura atualizadas com sucesso",
      requireData: true,
    }
  ),

  deleteIncomeOrExpenseTransaction: createAuthenticatedRoute<{ id: string }, void>(
    TransactionController.deleteIncomeOrExpenseTransaction,
    {
      successMessage: "Transação excluída com sucesso",
      requireData: true,
    }
  ),

  deleteInvoiceTransaction: createAuthenticatedRoute<{ id: string }, void>(
    TransactionController.deleteInvoiceTransaction,
    {
      successMessage: "Transação de fatura excluída com sucesso",
      requireData: true,
    }
  ),

  deleteRecurringTransaction: createAuthenticatedRoute<{ id: string }, void>(
    TransactionController.deleteRecurringTransaction,
    {
      successMessage: "Transações recorrentes excluídas com sucesso",
      requireData: true,
    }
  ),

  getAllIncomeOrExpense: createAuthenticatedRoute<void, any>(
    TransactionController.getAllIncomeOrExpense,
    {
      successMessage: "Transações recuperadas com sucesso",
    }
  ),

  getAllInvoices: createAuthenticatedRoute<void, any>(
    TransactionController.getAllInvoices,
    {
      successMessage: "Faturas recuperadas com sucesso",
    }
  ),

  updateRecurringTransactionGroup: createAuthenticatedRoute<
    Partial<TransactionRequestDTO> & { id: string },
    void
  >(
    TransactionController.updateRecurringTransactionGroup,
    {
      successMessage: "Grupo de transações recorrentes atualizado com sucesso",
      requireData: true,
    }
  ),

  markRecurringTransactionAsPaid: createAuthenticatedRoute<{ id: string }, void>(
    TransactionController.markRecurringTransactionAsPaid,
    {
      successMessage: "Transação recorrente marcada como paga",
      requireData: true,
    }
  ),

  markRecurringTransactionAsUnpaid: createAuthenticatedRoute<{ id: string }, void>(
    TransactionController.markRecurringTransactionAsUnpaid,
    {
      successMessage: "Transação recorrente marcada como não paga",
      requireData: true,
    }
  ),

  payInvoiceInstallment: createAuthenticatedRoute<{ id: string }, void>(
    TransactionController.payInvoiceInstallment,
    {
      successMessage: "Parcela da fatura marcada como paga",
      requireData: true,
    }
  ),
};

