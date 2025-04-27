import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";


import { db } from "../config/firebase";
import {TransactionRequestDTO } from "../dto/TransactionRequestDTO";
import { TransactionFrequency } from "../enums/TransactionFrequency";
import { Transaction } from "../models/Transaction";
import { TransactionRepository } from "../repositories/TransactionRepository";

dayjs.extend(isSameOrBefore);
dayjs.extend(utc);
dayjs.extend(timezone);





export class TransactionService {
 
  static async createTransaction(uid: string, data: TransactionRequestDTO): Promise<void> {
  
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
          date: dayjs.utc(data.startDate).add(3,"hour").toDate(),
          type: data.type,
          isRecurring: data.isRecurring,
          isPaid: data.isPaid,
          currency: data.currency,
          bankAccountId: data.bankAccountId
        };

      await TransactionRepository.createMany(uid, [transaction]);
      return;
    }

    const transactions: Transaction[] = [];
    let currentDate: dayjs.Dayjs = dayjs.utc(data.startDate);
    const endDate: dayjs.Dayjs = dayjs.utc(data.endDate);

    while (currentDate.isSameOrBefore(endDate, "day")) {
      console.log("Criando varias transações... ");
      const id = db
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc().id;

      const transaction: Transaction = {
        ...data,
        id,
        date: currentDate.add(3,"hour").toDate(),
        startDate: currentDate.add(3,"hour").toDate(),
        endDate: endDate.add(3,"hour").toDate(),
        isPaid: false,
      };

      transactions.push(transaction);

      currentDate = this.calculateNextDate(currentDate, data.frequency!);
    }

    await TransactionRepository.createMany(uid, transactions);
   
  }

  static async update(
    uid: string,
    transactionId: string,
    data: Partial<TransactionRequestDTO>
  ): Promise<void> {
    await TransactionRepository.update(uid, transactionId, data);
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

    await TransactionRepository.update(uid, transactionId, { isPaid });
  }

  private static calculateNextDate(
    currentDate: dayjs.Dayjs,
    frequency: TransactionFrequency
  ): dayjs.Dayjs {
    switch (frequency) {
      case "WEEKLY": return currentDate.add(1, "week");
      case "BIWEEKLY": return currentDate.add(2, "week");
      case "MONTHLY": return currentDate.add(1, "month");
      case "BIMONTHLY": return currentDate.add(2, "month");
      case "QUARTERLY": return currentDate.add(3, "month");
      case "SEMIANNUALLY": return currentDate.add(6, "month");
      case "ANNUALLY": return currentDate.add(1, "year");
      default:
        throw new Error(`Frequência inválida para recorrência: ${frequency}`);
    }
  }
}
