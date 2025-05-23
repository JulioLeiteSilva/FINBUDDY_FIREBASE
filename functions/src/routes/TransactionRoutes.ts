import * as functions from "firebase-functions";
import { TransactionController } from "../controllers/TransactionController";
import { throwHttpsError } from "../utils/errorHandler";
import { TransactionRequestDTO } from "../dto/TransactionRequestDTO";

export const transactionRoutes = {
  createTransaction: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    try {
      await TransactionController.createTransaction(
        auth.uid,
        data as TransactionRequestDTO
      );
      return { message: "Transação criada com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Transação");
    }
  }),

  updateTransaction: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    try {
      await TransactionController.updateTransaction(
        auth.uid,
        data.id,
        data as TransactionRequestDTO
      );
      return { message: "Transação atualizada com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Transação");
    }
  }),


  deleteTransaction: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    try {
      await TransactionController.deleteTransaction(auth.uid, data.id);
      return { message: "Transação excluída com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Transação");
    }
  }),

  getAllTransactions: functions.https.onCall(async (request) => {
    const { auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    try {
      const transactions = await TransactionController.getAllTransactions(
        auth.uid
      );
      return { message: "Transações recuperadas com sucesso", transactions };
    } catch (error) {
      return throwHttpsError(error as Error, "Transação");
    }
  }),

  deleteRecurringTransaction: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    try {
      await TransactionController.deleteRecurringTransaction(auth.uid, data.id);
      return { message: "Transações recorrentes excluídas com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Transação");
    }
  }),
};
