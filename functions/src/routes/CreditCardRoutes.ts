import * as functions from "firebase-functions";
import { CreditCardController } from "../controllers/CreditCardController";
import { throwHttpsError } from "../utils/errorHandler";
import { CreditCardRequestDTO } from "../dto/CreditCardRequestDTO";

export const creditCardRoutes = {
  create: functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    try {
      await CreditCardController.create(auth.uid, data as CreditCardRequestDTO);
      return { message: "Cartão criado com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Conta bancária");
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
      await CreditCardController.update(
        auth.uid,
        data.id,
        data as CreditCardRequestDTO
      );
      return { message: "Cartão atualizado com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Cartão");
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
      await CreditCardController.delete(auth.uid, data.id);
      return { message: "Cartão excluído com sucesso" };
    } catch (error) {
      return throwHttpsError(error as Error, "Cartão");
    }
  }),

  getAll: functions.https.onCall(async (request) => {
    const { auth } = request;
    if (!auth?.uid)
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    try {
      const cards = await CreditCardController.getAll(auth.uid);
      return { message: "Cartões recuperados com sucesso", cards };
    } catch (error) {
      return throwHttpsError(error as Error, "Cartão");
    }
  }),
};
