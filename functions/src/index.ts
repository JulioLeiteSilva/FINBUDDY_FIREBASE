import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { userRoutes } from "./routes/UserRoutes";
import { bankAccountRoutes } from "./routes/BankAccountRoutes";
import { globalCategoryRoutes } from "./routes/GlobalCategoryRoutes";
import { categoryRoutes } from "./routes/CategoryRoutes";
import { transactionRoutes } from "./routes/TransactionRoutes";

// Exporta todas as funções agrupadas sob o namespace `user`
export const user = userRoutes;
export const bank = bankAccountRoutes;
export const globalCategory = globalCategoryRoutes;
export const category = categoryRoutes
export const transaction = transactionRoutes;

// Função de teste opcional
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});
