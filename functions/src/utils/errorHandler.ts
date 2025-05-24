import * as functions from "firebase-functions";

interface ValidationError {
  field: string;
  message: string;
}

type EntityType =
  | "Conta bancária"
  | "Usuário"
  | "Transação"
  | "Objetivo financeiro"
  | "Categoria";

const getNotFoundMessage = (entity: EntityType) =>
  `${entity} não encontrado(a)`;

export interface AppErrorResponse {
  code: "VALIDATION_ERROR" | "INTERNAL_ERROR" | "NOT_FOUND";
  message: string;
  validationErrors?: ValidationError[];
}

export const createErrorResponse = (
  error: Error,
  defaultMessage: string = "Erro interno do servidor"
): AppErrorResponse => {
  if (error.message.startsWith("Validation failed:")) {
    const validationErrors = JSON.parse(
      error.message.replace("Validation failed:", "")
    );
    return {
      code: "VALIDATION_ERROR",
      message: "Dados inválidos fornecidos",
      validationErrors,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    message: defaultMessage,
  };
};

export const throwHttpsError = (error: Error, entity?: EntityType) => {
  // Handle validation errors
  if (error.message.startsWith("Validation failed:")) {
    const validationErrors = JSON.parse(
      error.message.replace("Validation failed:", "")
    );
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Dados inválidos fornecidos",
      validationErrors
    );
  }

  // Handle not found errors
  if (entity && error.message.includes("não encontrado")) {
    throw new functions.https.HttpsError(
      "not-found",
      getNotFoundMessage(entity)
    );
  }

  // Handle concurrent updates
  if (error.message.includes("FAILED_PRECONDITION")) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Operação não permitida. O recurso pode ter sido atualizado por outro usuário."
    );
  }

  // Handle all other errors
  throw new functions.https.HttpsError("internal", error.message);
};
