import { createAuthenticatedRoute } from "../utils/routeWrapper";
import { CreditCardInvoiceController } from "../controllers/CreditCardInvoiceController";
import { CreditCardInvoice } from "../models/CreditCardInvoice";

export const creditCardInvoiceRoutes = {
  create: createAuthenticatedRoute<{ cardId: string; invoice: CreditCardInvoice }, void>(
    async (request) => {
      await CreditCardInvoiceController.create(request);
    },
    {
      successMessage: "Fatura criada com sucesso",
      requireData: true,
    }
  ),

  update: createAuthenticatedRoute<{ cardId: string; invoiceId: string; data: Partial<CreditCardInvoice> }, void>(
    async (request) => {
      await CreditCardInvoiceController.update(request);
    },
    {
      successMessage: "Fatura atualizada com sucesso",
      requireData: true,
    }
  ),

  delete: createAuthenticatedRoute<{ cardId: string; invoiceId: string }, void>(
    async (request) => {
      await CreditCardInvoiceController.delete(request);
    },
    {
      successMessage: "Fatura excluída com sucesso",
      requireData: true,
    }
  ),

  getAll: createAuthenticatedRoute<{ cardId: string }, { invoices: CreditCardInvoice[] }>(
    async (request) => {
      const invoices = await CreditCardInvoiceController.getAll(request);
      return { invoices };
    },
    {
      successMessage: "Faturas recuperadas com sucesso",
      requireData: true,
    }
  ),

  payInvoice: createAuthenticatedRoute<{ cardId: string; invoiceId: string; bankAccountId: string }, void>(
    async (request) => {
      await CreditCardInvoiceController.payInvoice(request);
    },
    {
      successMessage: "Fatura paga com sucesso",
      requireData: true,
    }
  ),
};

