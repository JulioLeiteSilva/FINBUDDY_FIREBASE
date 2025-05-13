import * as functions from "firebase-functions";
import { GlobalCategoryController } from "../controllers/GlobalCategoryController";


export const globalCategoryRoutes = {
  seedCategoriesDefaults: functions.https.onCall(async () => {
    await GlobalCategoryController.seedDefaults();
    return { message: "Categorias default criadas no Firestore (emulador) com sucesso." };
  }),
};
