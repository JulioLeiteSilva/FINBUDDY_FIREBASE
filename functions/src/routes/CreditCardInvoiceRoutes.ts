import * as functions from "firebase-functions";
import { CreditCardInvoiceController } from "../controllers/CreditCardInvoiceController";
import { throwHttpsError } from "../utils/errorHandler";
import { CreditCardInvoice } from "../models/CreditCardInvoice";

export const creditCardInvoiceRoutes = {
  create: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    try {
      await CreditCardInvoiceController.create(
        auth.uid,
        data.cardId,
        data.invoice as CreditCardInvoice
      );
      return { message: "Fatura criada com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Fatura");
    }
  }),

  update: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    try {
      await CreditCardInvoiceController.update(
        auth.uid,
        data.cardId,
        data.invoiceId,
        data.invoice as Partial<CreditCardInvoice>
      );
      return { message: "Fatura atualizada com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Fatura");
    }
  }),

  delete: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    try {
      await CreditCardInvoiceController.delete(
        auth.uid,
        data.cardId,
        data.invoiceId
      );
      return { message: "Fatura excluída com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Fatura");
    }
  }),

  getAll: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    try {
      const invoices = await CreditCardInvoiceController.getAll(
        auth.uid,
        data.cardId
      );
      return { message: "Faturas recuperadas com sucesso", invoices };
    } catch (error) {
      return throwHttpsError(error as Error, "Fatura");
    }
  }),

  payInvoice: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    try {
      await CreditCardInvoiceController.payInvoice(
        auth.uid,
        data.cardId,
        data.invoiceId,
        data.bankAccountId
      );
      return { message: "Fatura paga com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Fatura");
    }
  }),
};
