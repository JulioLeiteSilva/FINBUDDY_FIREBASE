import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { z } from "zod";
import { db } from "../../config/firebase";
import { TransactionRequestDTO, TransactionRequestSchema } from "../../dto/TransactionRequestDTO";
import { Transaction } from "../../models/Transaction";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { BankAccountService } from "../BankAccountService";
import { TRANSACTION_CONSTANTS } from "./shared/TransactionConstants";

dayjs.extend(timezone);

export class SimpleTransactionService {
    private static readonly ERROR_MESSAGES = {
        ...TRANSACTION_CONSTANTS.ERROR_MESSAGES,
        CANNOT_CHANGE_RECURRING_STATUS: "Não é possível alterar o status de recorrência de uma transação",
        CANNOT_CHANGE_RECURRING_PROPERTIES: "Não é possível alterar propriedades de recorrência (frequency, startDate, endDate)",
        CANNOT_EDIT_RECURRING_TRANSACTION: "Não é possível editar transações recorrentes individualmente. Use o método específico para transações recorrentes",
    };

    private static readonly TIMEZONE = TRANSACTION_CONSTANTS.TIMEZONE;

    static async create(uid: string, data: TransactionRequestDTO): Promise<void> {
        const validatedData = this.validateTransactionData(data);
        await this.validateBankAccountExists(uid, validatedData.bankAccountId);

        const id = db
            .collection("users")
            .doc(uid)
            .collection("transactions")
            .doc().id;

        let transaction: any = {
            id,
            name: validatedData.name,
            category: validatedData.category,
            value: validatedData.value,
            date: this.formatDate(validatedData.date),
            type: validatedData.type,
            isRecurring: false,
            isPaid: validatedData.isPaid,
            currency: validatedData.currency,
            bankAccountId: validatedData.bankAccountId,
            frequency: undefined,
            startDate: undefined,
            endDate: undefined,
        };

        Object.keys(transaction).forEach(
            (key) => transaction[key] === undefined && delete transaction[key]
        );
        transaction = transaction as Transaction;

        await TransactionRepository.createMany(uid, [transaction]);

        if (validatedData.isPaid) {
            await this.adjustBankAccountBalance(
                uid,
                validatedData.bankAccountId,
                validatedData.value,
                validatedData.type,
                true
            );
        }
    }

    static async update(uid: string, transactionId: string, data: TransactionRequestDTO): Promise<void> {
        const validatedData = this.validateTransactionData(data);

        const transaction = await TransactionRepository.get(uid, transactionId);

        if (!transaction) {
            throw new Error(this.ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
        }

        if (transaction.type === "INVOICE") {
            throw new Error("Não é permitido atualizar transações do tipo INVOICE.");
        }

        if (transaction.isRecurring) {
            throw new Error(this.ERROR_MESSAGES.CANNOT_EDIT_RECURRING_TRANSACTION);
        }

        this.validateRecurringChanges(transaction, validatedData);

        const updatePayload: Transaction = {
            id: transactionId,
            name: validatedData.name,
            category: validatedData.category,
            value: validatedData.value,
            date: this.formatDate(validatedData.date),
            type: validatedData.type,
            isRecurring: false,
            isPaid: validatedData.isPaid,
            currency: validatedData.currency,
            bankAccountId: validatedData.bankAccountId,
            frequency: undefined,
            startDate: undefined,
            endDate: undefined,
        };

        Object.keys(updatePayload).forEach(
            (key) =>
                updatePayload[key as keyof Transaction] === undefined &&
                delete updatePayload[key as keyof Transaction]
        );

        await this.validateBankAccountExists(uid, validatedData.bankAccountId!);

        await this.handleBalanceAdjustments(uid, transaction, validatedData);

        await TransactionRepository.update(uid, transactionId, updatePayload);
    }

    static async delete(uid: string, transactionId: string): Promise<void> {
        const transaction = await TransactionRepository.get(uid, transactionId);
        if (!transaction) {
            throw new Error("Transação não encontrada");
        }

        if (transaction.type === "INVOICE") {
            throw new Error("Use o método específico para deletar transações do tipo INVOICE.");
        }

        if (transaction.isRecurring) {
            throw new Error("Não é possível deletar transações recorrentes individualmente. Use o método específico para transações recorrentes.");
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

    static async getAllIncomeOrExpense(uid: string) {
        const all = await TransactionRepository.getAll(uid);
        return all.filter((t) => t.type === "INCOME" || t.type === "EXPENSE");
    }

    private static validateRecurringChanges(
        existingTransaction: Transaction,
        updateData: TransactionRequestDTO
    ): void {
        if (updateData.isRecurring !== undefined && updateData.isRecurring !== existingTransaction.isRecurring) {
            throw new Error(this.ERROR_MESSAGES.CANNOT_CHANGE_RECURRING_STATUS);
        }

        if (!existingTransaction.isRecurring) {
            const recurringProperties = ['frequency', 'startDate', 'endDate'];
            const hasRecurringProperties = recurringProperties.some(prop =>
                updateData[prop as keyof TransactionRequestDTO] !== undefined &&
                updateData[prop as keyof TransactionRequestDTO] !== null
            );

            if (hasRecurringProperties) {
                throw new Error(this.ERROR_MESSAGES.CANNOT_CHANGE_RECURRING_PROPERTIES);
            }
        }

        if (existingTransaction.isRecurring) {
            const recurringProperties = ['frequency', 'startDate', 'endDate'];
            const isChangingRecurringProperties = recurringProperties.some(prop => {
                const newValue = updateData[prop as keyof TransactionRequestDTO];
                const oldValue = existingTransaction[prop as keyof Transaction];

                return newValue !== undefined &&
                    newValue !== null &&
                    String(newValue) !== String(oldValue);
            });

            if (isChangingRecurringProperties) {
                throw new Error(this.ERROR_MESSAGES.CANNOT_CHANGE_RECURRING_PROPERTIES);
            }
        }
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

    private static async handleBalanceAdjustments(
        uid: string,
        oldTransaction: Transaction,
        newData: TransactionRequestDTO
    ): Promise<void> {
        const oldIsPaid = oldTransaction.isPaid;
        const newIsPaid = newData.isPaid ?? oldIsPaid;
        const oldValue = oldTransaction.value;
        const newValue = newData.value ?? oldValue;
        const oldBankAccountId = oldTransaction.bankAccountId;
        const newBankAccountId = newData.bankAccountId;
        const bankAccountChanged = newBankAccountId !== oldBankAccountId;

        if (oldIsPaid && !newIsPaid) {
            await this.adjustBankAccountBalance(
                uid,
                oldTransaction.bankAccountId,
                oldValue,
                oldTransaction.type,
                false
            );
        }

        if (!oldIsPaid && newIsPaid) {
            await this.adjustBankAccountBalance(
                uid,
                oldTransaction.bankAccountId,
                newValue,
                oldTransaction.type,
                true
            );
        }

        if (oldIsPaid && newIsPaid && oldValue !== newValue) {
            await this.adjustBankAccountBalance(
                uid,
                oldTransaction.bankAccountId,
                oldValue,
                oldTransaction.type,
                false
            );
            await this.adjustBankAccountBalance(
                uid,
                oldTransaction.bankAccountId,
                newValue,
                oldTransaction.type,
                true
            );
        }

        if (oldTransaction.isPaid && bankAccountChanged) {
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
}
