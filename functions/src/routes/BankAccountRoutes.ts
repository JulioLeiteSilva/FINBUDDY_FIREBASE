import * as functions from "firebase-functions";
import { BankAccountController } from "../controllers/BankAccountController";

export const bankAccountRoutes = {
  createBankAccount: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );

    return await BankAccountController.create(auth.uid, data);
  }),

  updateBankAccount: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );

    return await BankAccountController.update(auth.uid, data.id, data);
  }),

  updateBankAccountBalance: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );

    return await BankAccountController.updateBalance(auth.uid, data.id, {
      balance: data.balance,
    });
  }),

  deleteBankAccount: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );

    return await BankAccountController.delete(auth.uid, data.id);
  }),

  getBankAccount: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );

    return await BankAccountController.get(auth.uid, data.id);
  }),

  getAllBankAccounts: functions.https.onCall(async (request) => {
    const { auth } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );

    return await BankAccountController.getAll(auth.uid);
  }),
};
