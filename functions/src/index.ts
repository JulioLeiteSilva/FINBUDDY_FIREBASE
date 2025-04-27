import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { userRoutes } from "./routes/UserRoutes";
import { bankAccountRoutes } from "./routes/BankAccountRoutes";
import { TransactionRoutes } from "./routes/TransctionRoutes";

// Exporta todas as funções agrupadas sob o namespace `user`
export const user = userRoutes;
export const bank = bankAccountRoutes;
export const transaction = TransactionRoutes;

// Função de teste opcional
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});
