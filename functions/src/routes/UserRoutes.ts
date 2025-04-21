import * as functions from "firebase-functions";
import { UserController } from "../controllers/UserController";
import { CompleteUserProfileDTO } from "../dto/CompleteUserProfileDTO";
import { UserPreRegisterDTO } from "../dto/UserPreRegisterDTO";
import { UserStatus } from "../enums/UserStatus";

export const userRoutes = {
  preRegisterUser: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid || !auth.token.email) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "O usuário não está autenticado"
      );
    }

    const uid = auth.uid;
    const email = auth.token.email;
    const name = data.name;

    const dto: UserPreRegisterDTO = {
      name,
      email,
      status: UserStatus.PENDING,
      createdAt: new Date(),
    };

    try {
      const user = await UserController.preRegisterUser(dto, uid);
      return { message: "Usuário criado com sucesso", user };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        (error as Error).message
      );
    }
  }),

  completeUserProfile: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "O usuário não está autenticado"
      );
    }

    const uid: string = auth.uid;

    try {
      const result = await UserController.completeUserProfile(
        uid,
        data as CompleteUserProfileDTO
      );
      return { message: "Cadastro completo com sucesso", user: result };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        (error as Error).message
      );
    }
  }),

  deactivateUser: functions.https.onCall(async (request) => {
    const { auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "O usuário não está autenticado"
      );
    }

    const uid = auth.uid;

    try {
      const result = await UserController.deactivateUser(uid);
      return { message: "Usuário desativado com sucesso", user: result };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        (error as Error).message
      );
    }
  }),

  getUser: functions.https.onCall(async (request) => {
    const { auth } = request;

    if (!auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "O usuário não está autenticado"
      );
    }

    const uid: string = auth.uid;

    try {
      const user = await UserController.getUser(uid);
      if (!user) {
        throw new functions.https.HttpsError(
          "not-found",
          "Usuário não encontrado"
        );
      }

      return user;
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        (error as Error).message
      );
    }
  }),
};
