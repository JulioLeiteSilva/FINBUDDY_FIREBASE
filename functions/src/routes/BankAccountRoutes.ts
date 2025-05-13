import * as functions from "firebase-functions";
import { BankAccountController } from "../controllers/BankAccountController";
import { throwHttpsError } from "../utils/errorHandler";
import { CreateBankAccountDTO } from "../dto/CreateBankAccountDTO";
import { UpdateBankAccountDTO } from "../dto/UpdateBankAccountDTO";
import { UpdateBankAccountBalanceDTO } from "../dto/UpdateBankAccountBalanceDTO";

export const bankAccountRoutes = {
  createBankAccount: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    try {
      const result = await BankAccountController.create(
        auth.uid,
        data as CreateBankAccountDTO
      );
      return { message: "Conta bancária criada com sucesso", account: result };
    } catch (error) {
      return throwHttpsError(error as Error);
    }
  }),

  updateBankAccount: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    if (!data.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da conta é obrigatório"
      );
    }

    try {
      const result = await BankAccountController.update(
        auth.uid,
        data.id,
        data as UpdateBankAccountDTO
      );
      return {
        message: "Conta bancária atualizada com sucesso",
        account: result,
      };
    } catch (error) {
      return throwHttpsError(error as Error, "Conta bancária");
    }
  }),

  updateBankAccountBalance: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    if (!data.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da conta é obrigatório"
      );
    }

    try {
      const balanceData: UpdateBankAccountBalanceDTO = {
        balance: data.balance,
      };
      const result = await BankAccountController.updateBalance(
        auth.uid,
        data.id,
        balanceData
      );
      return { message: "Saldo atualizado com sucesso", account: result };
    } catch (error) {
      return throwHttpsError(error as Error, "Conta bancária");
    }
  }),

  deleteBankAccount: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    if (!data.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da conta é obrigatório"
      );
    }

    try {
      await BankAccountController.delete(auth.uid, data.id);
      return { message: "Conta bancária excluída com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Conta bancária");
    }
  }),

  getBankAccount: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    if (!data.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da conta é obrigatório"
      );
    }

    try {
      const account = await BankAccountController.get(auth.uid, data.id);
      return account;
    } catch (error) {
      return throwHttpsError(error as Error, "Conta bancária");
    }
  }),

  getAllBankAccounts: functions.https.onCall(async (request) => {
    const { auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    try {
      const accounts = await BankAccountController.getAll(auth.uid);
      return accounts;
    } catch (error) {
      return throwHttpsError(error as Error);
    }
  }),
};
