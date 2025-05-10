import * as functions from "firebase-functions";
import { TransactionController } from "../controllers/TransactionController";

export const TransactionRoutes = {
  createTransaction: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    return await TransactionController.createTransaction(auth.uid, data);
  }),

  updateTransaction: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    return await TransactionController.updateTransaction(
      auth.uid,
      data.id,
      data
    );
  }),

  updateIsPaidTransaction: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    return await TransactionController.updateIsPaidTransaction(
      auth.uid,
      data.id,
      data.isPaid
    );
  }),

  deleteTransaction: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    return await TransactionController.deleteTransaction(auth.uid, data.id);
  }),

  getAllTransactions: functions.https.onCall(async (request) => {
    const { auth } = request;
    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    return await TransactionController.getAllTransactions(auth.uid);
  }),

  deleteRecurringTransaction: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    if (!data?.transactionId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da transação é obrigatório"
      );
    }

    await TransactionController.deleteRecurringTransaction(auth.uid, data.transactionId);
  }),
};
