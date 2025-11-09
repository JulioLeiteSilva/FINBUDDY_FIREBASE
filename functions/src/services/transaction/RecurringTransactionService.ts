import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import timezone from "dayjs/plugin/timezone";
import { z } from "zod";
import { db } from "../../config/firebase";
import { TransactionRequestDTO, TransactionRequestSchema } from "../../dto/TransactionRequestDTO";
import { TransactionFrequency } from "../../enums/TransactionFrequency";
import { Transaction } from "../../models/Transaction";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { BankAccountService } from "../BankAccountService";
import { TRANSACTION_CONSTANTS } from "./shared/TransactionConstants";

dayjs.extend(isSameOrBefore);
dayjs.extend(timezone);

export class RecurringTransactionService {
    private static readonly ERROR_MESSAGES = {
        ...TRANSACTION_CONSTANTS.ERROR_MESSAGES,
        INVALID_RECURRING_DATA: "Transações recorrentes precisam de frequência, data inicial e data final",
        RECURRING_PERIOD_TOO_LONG: "O período de recorrência não pode ser maior que 1 ano",
        CANNOT_UPDATE_RECURRING_INDIVIDUAL: "Não é possível atualizar transações recorrentes individualmente",
    };

    private static readonly TIMEZONE = TRANSACTION_CONSTANTS.TIMEZONE;

    static async create(uid: string, data: TransactionRequestDTO): Promise<void> {
        const validatedData = this.validateTransactionData(data);
        this.validateRecurringData(validatedData);
        await this.validateBankAccountExists(uid, validatedData.bankAccountId);
        const transactions = this.generateRecurringTransactions(uid, validatedData);
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

    static async deleteRecurring(uid: string, transactionId: string): Promise<void> {
        const transaction = await TransactionRepository.get(uid, transactionId);
        if (!transaction) {
            throw new Error("Transação não encontrada");
        }
        if (!transaction.isRecurring) {
            throw new Error(this.ERROR_MESSAGES.NOT_RECURRING);
        }
        await TransactionRepository.deleteRecurring(uid, transaction);
    }

    static async updateRecurringGroup(
        uid: string,
        transactionId: string,
        data: Partial<TransactionRequestDTO>
    ): Promise<void> {
        const transaction = await TransactionRepository.get(uid, transactionId);
        if (!transaction) {
            throw new Error("Transação não encontrada");
        }
        if (!transaction.isRecurring) {
            throw new Error(this.ERROR_MESSAGES.NOT_RECURRING);
        }
        const allowedFields = ['name', 'category', 'value', 'currency', 'bankAccountId', 'isPaid'];
        const updateData: Partial<Transaction> = {};
        allowedFields.forEach(field => {
            if (data[field as keyof TransactionRequestDTO] !== undefined) {
                updateData[field as keyof Transaction] = data[field as keyof TransactionRequestDTO] as any;
            }
        });
        if (Object.keys(updateData).length === 0) {
            throw new Error("Nenhum campo válido para atualização foi fornecido");
        }
        const relatedTransactions = await this.getRelatedRecurringTransactions(uid, transaction);
        if (relatedTransactions.length === 0) {
            throw new Error("Não há transações para atualizar neste grupo recorrente");
        }
        for (const relatedTransaction of relatedTransactions) {
            if (updateData.isPaid !== undefined || updateData.value !== undefined || updateData.bankAccountId !== undefined) {
                await this.handleBalanceAdjustmentsForTransaction(
                    uid,
                    relatedTransaction,
                    updateData
                );
            }
            await TransactionRepository.update(uid, relatedTransaction.id, {
                ...relatedTransaction,
                ...updateData
            });
        }
    }

    private static async handleBalanceAdjustmentsForTransaction(
        uid: string,
        oldTransaction: Transaction,
        updateData: Partial<Transaction>
    ): Promise<void> {
        const oldIsPaid = oldTransaction.isPaid;
        const newIsPaid = updateData.isPaid !== undefined ? updateData.isPaid : oldIsPaid;
        const oldValue = oldTransaction.value;
        const newValue = updateData.value !== undefined ? updateData.value : oldValue;
        const oldBankAccountId = oldTransaction.bankAccountId;
        const newBankAccountId = updateData.bankAccountId !== undefined ? updateData.bankAccountId : oldBankAccountId;
        if (oldIsPaid && !newIsPaid) {
            await this.adjustBankAccountBalance(
                uid,
                oldBankAccountId,
                oldValue,
                oldTransaction.type,
                false
            );
        }
        if (!oldIsPaid && newIsPaid) {
            await this.adjustBankAccountBalance(
                uid,
                newBankAccountId!,
                newValue,
                oldTransaction.type,
                true
            );
        }
        if (oldIsPaid && newIsPaid && oldValue !== newValue) {
            await this.adjustBankAccountBalance(
                uid,
                oldBankAccountId,
                oldValue,
                oldTransaction.type,
                false
            );
            await this.adjustBankAccountBalance(
                uid,
                newBankAccountId!,
                newValue,
                oldTransaction.type,
                true
            );
        }
        if (oldIsPaid && newIsPaid && oldBankAccountId !== newBankAccountId) {
            await this.adjustBankAccountBalance(
                uid,
                oldBankAccountId,
                oldValue,
                oldTransaction.type,
                false
            );
            await this.adjustBankAccountBalance(
                uid,
                newBankAccountId!,
                newValue,
                oldTransaction.type,
                true
            );
        }
    }

    static async markRecurringTransactionAsPaid(uid: string, transactionId: string): Promise<void> {
        const transaction = await TransactionRepository.get(uid, transactionId);
        if (!transaction) {
            throw new Error("Transação não encontrada");
        }
        if (!transaction.isRecurring) {
            throw new Error(this.ERROR_MESSAGES.NOT_RECURRING);
        }
        if (transaction.isPaid) {
            throw new Error("Transação já está marcada como paga");
        }
        await this.handleBalanceAdjustmentsForTransaction(uid, transaction, { isPaid: true });
        await TransactionRepository.update(uid, transactionId, {
            ...transaction,
            isPaid: true
        });
    }

    static async markRecurringTransactionAsUnpaid(uid: string, transactionId: string): Promise<void> {
        const transaction = await TransactionRepository.get(uid, transactionId);
        if (!transaction) {
            throw new Error("Transação não encontrada");
        }
        if (!transaction.isRecurring) {
            throw new Error(this.ERROR_MESSAGES.NOT_RECURRING);
        }
        if (!transaction.isPaid) {
            throw new Error("Transação já está marcada como não paga");
        }
        await this.handleBalanceAdjustmentsForTransaction(uid, transaction, { isPaid: false });
        await TransactionRepository.update(uid, transactionId, {
            ...transaction,
            isPaid: false
        });
    }

    private static validateTransactionData(data: TransactionRequestDTO): TransactionRequestDTO {
        try {
            return TransactionRequestSchema.parse(data);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));
                throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
            }
            throw error;
        }
    }

    private static validateRecurringData(data: TransactionRequestDTO): void {
        if (!data.isRecurring) {
            throw new Error("Dados não são para transação recorrente");
        }
        if (!data.frequency || !data.startDate || !data.endDate) {
            throw new Error(this.ERROR_MESSAGES.INVALID_RECURRING_DATA);
        }
        const startDate = dayjs(data.startDate);
        const endDate = dayjs(data.endDate);
        const diffInYears = endDate.diff(startDate, "year", true);
        if (diffInYears > 1) {
            throw new Error(this.ERROR_MESSAGES.RECURRING_PERIOD_TOO_LONG);
        }
        if (endDate.isBefore(startDate)) {
            throw new Error("Data final deve ser posterior à data inicial");
        }
    }

    private static generateRecurringTransactions(uid: string, data: TransactionRequestDTO): Transaction[] {
        const transactions: Transaction[] = [];
        let currentDate: dayjs.Dayjs = dayjs.tz(data.date, this.TIMEZONE);
        const endDate: dayjs.Dayjs = dayjs.tz(data.endDate!, this.TIMEZONE);
        while (currentDate.isSameOrBefore(endDate, "day")) {
            const id = db
                .collection("users")
                .doc(uid)
                .collection("transactions")
                .doc().id;
            let transaction: any = {
                id,
                name: data.name,
                category: data.category,
                value: data.value,
                date: this.formatDate(currentDate.toDate()),
                isRecurring: true,
                frequency: data.frequency,
                isPaid: transactions.length === 0 ? data.isPaid : false,
                currency: data.currency,
                bankAccountId: data.bankAccountId,
                type: data.type,
                startDate: this.formatDate(data.startDate!),
                endDate: this.formatDate(data.endDate!),
            };
            Object.keys(transaction).forEach(
                (key) => transaction[key] === undefined && delete transaction[key]
            );
            transaction = transaction as Transaction;
            transactions.push(transaction);
            currentDate = this.calculateNextDate(currentDate, data.frequency!);
        }
        return transactions;
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

    private static async getRelatedRecurringTransactions(
        uid: string,
        transaction: Transaction
    ): Promise<Transaction[]> {
        return await TransactionRepository.getRelatedRecurringTransactions(uid, transaction);
    }

    private static formatDate(date: string | Date): Date {
        return dayjs.tz(date, this.TIMEZONE).toDate();
    }

    private static validateTransactionValue(value: number): void {
        if (value < 0) {
            throw new Error(this.ERROR_MESSAGES.NEGATIVE_VALUE);
        }
    }

    private static calculateNewBalance(
        currentBalance: number,
        value: number,
        type: "INCOME" | "EXPENSE" | "INVOICE",
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
        type: "INCOME" | "EXPENSE" | "INVOICE",
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
        await BankAccountService.updateBalance(uid, bankAccountId, newBalance);
    }

    private static async validateBankAccountExists(uid: string, bankAccountId: string): Promise<void> {
        const bankAccount = await BankAccountService.get(uid, bankAccountId);
        if (!bankAccount) {
            throw new Error(this.ERROR_MESSAGES.BANK_ACCOUNT_NOT_FOUND);
        }
    }
}

