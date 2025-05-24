import { CategoryController } from "../controllers/CategoryController";
import * as functions from "firebase-functions";
import { throwHttpsError } from "../utils/errorHandler";

export const categoryRoutes = {
  createCategory: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }
    try {
      await CategoryController.createCategory(auth.uid, data);
      return {
        message: "Criação de categoria efetuada com sucesso!",
      };
    } catch (error) {
      throwHttpsError(error as Error, "Categoria");
      return;
    }
  }),

  updateCategory: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    if (!data?.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da categoria é obrigatório"
      );
    }
    try {
      await CategoryController.updateCategory(auth.uid, data.id, data);
      return {
        message: "Atualização de categoria efetuada com sucesso!",
      };
    } catch (error) {
      throwHttpsError(error as Error, "Categoria");
      return;
    }
  }),

  deleteCategory: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    if (!data?.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da categoria é obrigatório"
      );
    }

    try {
      await CategoryController.deleteCategory(auth.uid, data.id);
      return {
        message: "Exclusão de categoria efetuada com sucesso!",
      };
    } catch (error) {
      throwHttpsError(error as Error, "Categoria");
      return;
    }
  }),

  getAllCategories: functions.https.onCall(async (request) => {
    const { auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }
    try {
      const categories = await CategoryController.getAllCategories(auth.uid);
      return {
        message: "Listagem de categorias efetuada com sucesso!",
        categories,
      };
    } catch (error) {
      throwHttpsError(error as Error, "Categoria");
      return;
    }
  }),

  getCategory: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    if (!data?.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da categoria é obrigatório"
      );
    }

    return await CategoryController.getCategory(auth.uid, data.id);
  }),
};
