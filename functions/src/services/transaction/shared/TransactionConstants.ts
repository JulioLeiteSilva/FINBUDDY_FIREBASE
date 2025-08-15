export const TRANSACTION_CONSTANTS = {
  TIMEZONE: "America/Sao_Paulo",
  ERROR_MESSAGES: {
    TRANSACTION_NOT_FOUND: "não encontrado",
    BANK_ACCOUNT_NOT_FOUND: "não encontrado",
    NEGATIVE_VALUE: "O valor da transação não pode ser negativo",
    NOT_RECURRING: "A transação não é recorrente",
    INVALID_FREQUENCY: (frequency: string) =>
      `Frequência inválida para recorrência: ${frequency}`,
    CANT_EDIT_RECURRING: "não é possível editar transações recorrentes",
  },
} as const;
