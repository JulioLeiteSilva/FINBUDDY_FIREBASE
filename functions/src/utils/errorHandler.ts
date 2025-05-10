import * as functions from "firebase-functions";

export interface ValidationError {
  field: string;
  message: string;
}

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

export const throwHttpsError = (error: Error, defaultMessage?: string) => {
  const errorResponse = createErrorResponse(error, defaultMessage);
  throw new functions.https.HttpsError(
    errorResponse.code === "VALIDATION_ERROR" ? "invalid-argument" : "internal",
    errorResponse.message,
    errorResponse.validationErrors
  );
};
