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
        date: dayjs.utc(data.date).add(3, "hour").toDate(),
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
    let currentDate: dayjs.Dayjs = dayjs.utc(data.startDate);
    const endDate: dayjs.Dayjs = dayjs.utc(data.endDate);

    while (currentDate.isSameOrBefore(endDate, "day")) {
      const id = db
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc().id;

      const transaction: Transaction = {
        ...data,
        id,
        date: currentDate.add(3, "hour").toDate(),
        startDate: currentDate.add(3, "hour").toDate(),
        endDate: endDate.add(3, "hour").toDate(),
        isPaid: transactions.length === 0 ? data.isPaid : false,
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
    const transaction = await TransactionRepository.get(uid, transactionId);

    if (!transaction) {
      throw new Error("Transação não encontrada");
    }
    await this.validateBankAccountExists(uid, data.bankAccountId!);

    const oldIsPaid = transaction.isPaid;
    const newIsPaid = data.isPaid ?? oldIsPaid;

    const oldValue = transaction.value;
    const newValue = data.value ?? oldValue;

    await TransactionRepository.update(uid, transactionId, data);

    if (oldIsPaid && !newIsPaid) {
      // Era pago, virou não pago -> REVERTE o saldo
      await this.adjustBankAccountBalance(uid, transaction.bankAccountId, oldValue, transaction.type, false);
    }
  
    if (!oldIsPaid && newIsPaid) {
      // Era não pago, virou pago -> APLICA o saldo
      await this.adjustBankAccountBalance(uid, transaction.bankAccountId, newValue, transaction.type, true);
    }
  
    if (oldIsPaid && newIsPaid && oldValue !== newValue) {
      // Continua pago, mas o valor mudou -> REVERTE saldo antigo e aplica saldo novo
      await this.adjustBankAccountBalance(uid, transaction.bankAccountId, oldValue, transaction.type, false);
      await this.adjustBankAccountBalance(uid, transaction.bankAccountId, newValue, transaction.type, true);
    }
  }

  static async delete(uid: string, transactionId: string): Promise<void> {
    await TransactionRepository.delete(uid, transactionId);
  }

  static async getAll(uid: string) {
    return await TransactionRepository.getAll(uid);
  }

  static async updateIsPaid(
    uid: string,
    transactionId: string,
    isPaid: boolean
  ): Promise<void> {
    const transaction = await TransactionRepository.get(uid, transactionId);

    if (!transaction) {
      throw new Error("Transação não encontrada");
    }
    
    await this.validateBankAccountExists(uid, transaction.bankAccountId);

    const oldIsPaid = transaction.isPaid;

    await TransactionRepository.update(uid, transactionId, { isPaid });

    if (oldIsPaid !== isPaid) {
      await this.adjustBankAccountBalance(
        uid,
        transaction.bankAccountId,
        transaction.value,
        transaction.type,
        isPaid
      );
    }
  }

  static async deleteRecurringTransactions(
    uid: string,
    transactionId: string
  ): Promise<void> {
    const transaction = await TransactionRepository.get(uid, transactionId);
    if (!transaction) {
      throw new Error("Transação não encontrada");
    }
  
    if (!transaction.isRecurring) {
      throw new Error("A transação não é recorrente");
    }
  
    await TransactionRepository.deleteRecurring(uid, transaction);
  }



  private static calculateNextDate(
    currentDate: dayjs.Dayjs,
    frequency: TransactionFrequency
  ): dayjs.Dayjs {
    switch (frequency) {
      case "WEEKLY":
        return currentDate.add(1, "week");
      case "BIWEEKLY":
        return currentDate.add(2, "week");
      case "MONTHLY":
        return currentDate.add(1, "month");
      case "BIMONTHLY":
        return currentDate.add(2, "month");
      case "QUARTERLY":
        return currentDate.add(3, "month");
      case "SEMIANNUALLY":
        return currentDate.add(6, "month");
      case "ANNUALLY":
        return currentDate.add(1, "year");
      default:
        throw new Error(`Frequência inválida para recorrência: ${frequency}`);
    }
  }

  private static async adjustBankAccountBalance(
    uid: string,
    bankAccountId: string,
    value: number,
    type: "INCOME" | "EXPENSE",
    isAdding: boolean
  ): Promise<void> {
    if (value < 0) {
      throw new Error("O valor da transação não pode ser negativo");
    }

    const bankAccount = await BankAccountService.get(uid, bankAccountId);
    
   

    let newBalance = bankAccount!.balance;

    if (type === "INCOME") {
      newBalance = isAdding ? newBalance + value : newBalance - value;
    } else if (type === "EXPENSE") {
      newBalance = isAdding ? newBalance - value : newBalance + value;
    }

    await BankAccountService.updateBalance(uid, bankAccountId, {
      balance: newBalance,
    });
  }

  private static async validateBankAccountExists(uid: string, bankAccountId: string): Promise<void> {
    const bankAccount = await BankAccountService.get(uid, bankAccountId);
    if (!bankAccount) {
      throw new Error("Conta bancária não encontrada");
    }
  }

}
