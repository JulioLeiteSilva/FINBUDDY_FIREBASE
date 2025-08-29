import { onRequest } from "firebase-functions/v2/https";
const { setGlobalOptions } = require("firebase-functions/v2");
import * as logger from "firebase-functions/logger";
setGlobalOptions({ region: "southamerica-east1" });

import { userRoutes } from "./routes/UserRoutes";
import { bankAccountRoutes } from "./routes/BankAccountRoutes";
import { globalCategoryRoutes } from "./routes/GlobalCategoryRoutes";
import { categoryRoutes } from "./routes/CategoryRoutes";
import { transactionRoutes } from "./routes/TransactionRoutes";
import { creditCardRoutes } from "./routes/CreditCardRoutes";
import { creditCardInvoiceRoutes } from "./routes/CreditCardInvoiceRoutes";
import { financialPlanningRoutes } from "./routes/FinancialPlanningRoutes";
import { createDocsApp } from "./docs/swagger-setup";
import { updateInvoiceStatuses } from "./scheduledTasks/invoiceStatusUpdater";

export const user = userRoutes;
export const bank = bankAccountRoutes;
export const globalCategory = globalCategoryRoutes;
export const category = categoryRoutes;
export const transaction = transactionRoutes;
export const creditCard = creditCardRoutes;
export const creditCardInvoice = creditCardInvoiceRoutes;
export const financialPlanning = financialPlanningRoutes;
export const docs = onRequest(createDocsApp());
export const scheduledInvoiceStatusUpdate = updateInvoiceStatuses;

