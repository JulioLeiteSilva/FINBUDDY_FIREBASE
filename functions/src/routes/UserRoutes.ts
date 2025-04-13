import * as functions from "firebase-functions";
import { UserController } from "../controllers/UserController";

export const userRoutes = {
  createUser: functions.https.onCall(async (request) => {
    const { auth, data } = request;

    if (!auth?.uid || !auth.token.email) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "O usuário não está autenticado"
      );
    }

    const uid: string = auth.uid;
    const email: string = auth.token.email;
    const name: string = data.name;

    try {
      const user = await UserController.createUser(name, uid, email);
      return { message: "Usuário criado com sucesso", user };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        (error as Error).message
      );
    }
  }),

  // getUser, updateUser, deleteUser vêm depois
};
