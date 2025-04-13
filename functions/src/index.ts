import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { userRoutes } from "./routes/UserRoutes";

// Exporta todas as funções agrupadas sob o namespace `user`
export const user = userRoutes;

// Função de teste opcional
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});
