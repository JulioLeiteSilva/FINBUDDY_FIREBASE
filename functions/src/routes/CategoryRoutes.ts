import { CategoryController } from "../controllers/CategoryController";
import * as functions from "firebase-functions";

export const categoryRoutes = {
  createCategory: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    await CategoryController.createCategory(auth.uid, data);
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

    await CategoryController.updateCategory(auth.uid, data.id, data);
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

    await CategoryController.deleteCategory(auth.uid, data.id);
  }),

  getAllCategories: functions.https.onCall(async (request) => {
    const { auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Usuário não autenticado"
      );
    }

    return await CategoryController.getAllCategories(auth.uid);
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