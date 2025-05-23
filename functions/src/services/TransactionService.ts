import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { db } from "../config/firebase";
import { TransactionRequestDTO } from "../dto/TransactionRequestDTO";
import { TransactionFrequency } from "../enums/TransactionFrequency";
import { Transaction } from "../models/Transaction";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { BankAccountService } from "./BankAccountService";

dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);

export class TransactionService {
  // Add standardized error messages
  private static readonly ERROR_MESSAGES = {
    TRANSACTION_NOT_FOUND: "não encontrado",
    BANK_ACCOUNT_NOT_FOUND: "não encontrado",
    NEGATIVE_VALUE: "O valor da transação não pode ser negativo",
    NOT_RECURRING: "A transação não é recorrente",
    INVALID_FREQUENCY: (frequency: string) =>
      `Frequência inválida para recorrência: ${frequency}`,
    CANT_EDIT_RECURRING: "não é possível editar transações recorrentes",
  };

  private static readonly TIMEZONE = "America/Sao_Paulo";

  private static formatDate(date: string | Date): Date {
    return dayjs.tz(date, this.TIMEZONE).toDate();
  }

  // Add input validation
  private static validateTransactionValue(value: number): void {
    if (value < 0) {
      throw new Error(this.ERROR_MESSAGES.NEGATIVE_VALUE);
    }
  }

  private static validateRecurringTransaction(transaction: Transaction): void {
    if (!transaction.isRecurring) {
      throw new Error(this.ERROR_MESSAGES.NOT_RECURRING);
    }
  }

  static async createTransaction(
    uid: string,
    data: TransactionRequestDTO
  ): Promise<void> {
    await this.validateBankAccountExists(uid, data.bankAccountId);

    if (!data.isRecurring) {
      const id = db
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc().id;
      const transaction: Transaction = {
        id,
        name: data.name,
        category: data.category,
        value: data.value,
        date: this.formatDate(data.date),
        type: data.type,
        isRecurring: data.isRecurring,
        isPaid: data.isPaid,
        currency: data.currency,
        bankAccountId: data.bankAccountId,
      };

      await TransactionRepository.createMany(uid, [transaction]);

      if (data.isPaid) {
        await this.adjustBankAccountBalance(
          uid,
          data.bankAccountId,
          data.value,
          data.type,
          true
        );
      }
      return;
    }

    const transactions: Transaction[] = [];
    let currentDate: dayjs.Dayjs = dayjs.utc(data.startDate, this.TIMEZONE);
    const endDate: dayjs.Dayjs = dayjs.utc(data.endDate, this.TIMEZONE);

    while (currentDate.isSameOrBefore(endDate, "day")) {
      const id = db
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc().id;

      const transaction: Transaction = {
        id,
        name: data.name,
        category: data.category,
        value: data.value,
        type: data.type,
        date: currentDate.toDate(),
        startDate: this.formatDate(data.startDate!),
        endDate: endDate.toDate(),
        isRecurring: data.isRecurring,
        frequency: data.frequency || undefined,
        isPaid: transactions.length === 0 ? data.isPaid : false,
        currency: data.currency,
        bankAccountId: data.bankAccountId,
      };

      transactions.push(transaction);

      currentDate = this.calculateNextDate(currentDate, data.frequency!);
    }

    await TransactionRepository.createMany(uid, transactions);

    if (transactions[0].isPaid) {
      await this.adjustBankAccountBalance(
        uid,
        transactions[0].bankAccountId,
        transactions[0].value,
        transactions[0].type,
        true
      );
    }
  }

  static async update(
    uid: string,
    transactionId: string,
    data: Partial<TransactionRequestDTO>
  ): Promise<void> {

    function removeUndefinedFields(obj: Record<string, any>) {
      return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== undefined)
      );
    }

    const transaction = await TransactionRepository.get(uid, transactionId);

    if (!transaction) {
      throw new Error("não encontrado");
    }
    if(transaction.isRecurring && "date" in data) {
      throw new Error("não é possível editar transações recorrentes");
    } 
    const newBankAccountId = data.bankAccountId;
    await this.validateBankAccountExists(uid, data.bankAccountId!);

    const oldIsPaid = transaction.isPaid;
    const newIsPaid = data.isPaid ?? oldIsPaid;

    const oldValue = transaction.value;
    const newValue = data.value ?? oldValue;

    const oldBankAccountId = transaction.bankAccountId;
    const bankAccountChanged = newBankAccountId !== oldBankAccountId;
    
    const updateDataRaw = {
      ...data,
      date: data.date ? dayjs(data.date).toDate() : undefined,
      startDate: data.startDate ? dayjs(data.startDate).toDate() : undefined,
      endDate: data.endDate ? dayjs(data.endDate).toDate() : undefined,
    };

    const updateData = removeUndefinedFields(updateDataRaw);
    
    await TransactionRepository.update(uid, transactionId, updateData);

    if (oldIsPaid && !newIsPaid) {
      // Era pago, virou não pago -> REVERTE o saldo
      await this.adjustBankAccountBalance(
        uid,
        transaction.bankAccountId,
        oldValue,
        transaction.type,
        false
      );
    }

    if (!oldIsPaid && newIsPaid) {
      // Era não pago, virou pago -> APLICA o saldo
      await this.adjustBankAccountBalance(
        uid,
        transaction.bankAccountId,
        newValue,
        transaction.type,
        true
      );
    }

    if (oldIsPaid && newIsPaid && oldValue !== newValue) {
      // Continua pago, mas o valor mudou -> REVERTE saldo antigo e aplica saldo novo
      await this.adjustBankAccountBalance(
        uid,
        transaction.bankAccountId,
        oldValue,
        transaction.type,
        false
      );
      await this.adjustBankAccountBalance(
        uid,
        transaction.bankAccountId,
        newValue,
        transaction.type,
        true
      );
    }

    if (transaction.isPaid && bankAccountChanged) {
      await this.adjustBankAccountBalance(
        uid,
        oldBankAccountId,
        oldValue,
        transaction.type,
        false
      );
      await this.adjustBankAccountBalance(
        uid,
        newBankAccountId!,
        newValue,
        transaction.type,
        true
      );
    }
  }

  static async delete(uid: string, transactionId: string): Promise<void> {
    const transaction = await TransactionRepository.get(uid, transactionId);
    if (!transaction) {
      throw new Error("Transação não encontrada");
    }

    if (transaction.isPaid) {
      await this.adjustBankAccountBalance(
        uid,
        transaction.bankAccountId,
        transaction.value,
        transaction.type,
        false
      );
    }
    await TransactionRepository.delete(uid, transactionId);
  }

  static async getAll(uid: string) {
    return await TransactionRepository.getAll(uid);
  }

  

  static async deleteRecurringTransactions(
    uid: string,
    transactionId: string
  ): Promise<void> {
    const transaction = await TransactionRepository.get(uid, transactionId);
    if (!transaction) {
      throw new Error("Transação não encontrada");
    }

    this.validateRecurringTransaction(transaction);

    await TransactionRepository.deleteRecurring(uid, transaction);
  }

  private static calculateNextDate(
    currentDate: dayjs.Dayjs,
    frequency: TransactionFrequency
  ): dayjs.Dayjs {
    const frequencyMap: Record<
      TransactionFrequency,
      [number, dayjs.ManipulateType]
    > = {
      WEEKLY: [1, "week"],
      BIWEEKLY: [2, "week"],
      MONTHLY: [1, "month"],
      BIMONTHLY: [2, "month"],
      QUARTERLY: [3, "month"],
      SEMIANNUALLY: [6, "month"],
      ANNUALLY: [1, "year"],
    };

    const [amount, unit] = frequencyMap[frequency] || [];
    if (!amount || !unit) {
      throw new Error(this.ERROR_MESSAGES.INVALID_FREQUENCY(frequency));
    }

    return currentDate.add(amount, unit);
  }

  private static calculateNewBalance(
    currentBalance: number,
    value: number,
    type: "INCOME" | "EXPENSE",
    isAdding: boolean
  ): number {
    this.validateTransactionValue(value);

    const multiplier = type === "INCOME" ? 1 : -1;
    const operation = isAdding ? 1 : -1;

    return currentBalance + value * multiplier * operation;
  }

  private static async adjustBankAccountBalance(
    uid: string,
    bankAccountId: string,
    value: number,
    type: "INCOME" | "EXPENSE",
    isAdding: boolean
  ): Promise<void> {
    const bankAccount = await BankAccountService.get(uid, bankAccountId);
    if (!bankAccount) {
      throw new Error(this.ERROR_MESSAGES.BANK_ACCOUNT_NOT_FOUND);
    }

    const newBalance = this.calculateNewBalance(
      bankAccount.balance,
      value,
      type,
      isAdding
    );

    await BankAccountService.updateBalance(uid, bankAccountId, {
      balance: newBalance,
    });
  }

  private static async validateBankAccountExists(
    uid: string,
    bankAccountId: string
  ): Promise<void> {
    const bankAccount = await BankAccountService.get(uid, bankAccountId);
    if (!bankAccount) {
      throw new Error(this.ERROR_MESSAGES.BANK_ACCOUNT_NOT_FOUND);
    }
  }
}
