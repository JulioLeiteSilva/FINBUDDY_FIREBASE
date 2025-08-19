import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { z } from "zod";
import { db } from "../../config/firebase";
import { TransactionRequestDTO, TransactionRequestSchema } from "../../dto/TransactionRequestDTO";
import { Transaction } from "../../models/Transaction";
import { CreditCard } from "../../models/CreditCard";
import { TransactionRepository } from "../../repositories/TransactionRepository";
import { CreditCardRepository } from "../../repositories/CreditCardRepository";
import { CreditCardInvoiceRepository } from "../../repositories/CreditCardInvoiceRepository";
import { CreditCardInvoiceService } from "../CreditCardInvoiceService";
import { InvoiceStatus } from "../../enums/InvoiceStatus";
import { TRANSACTION_CONSTANTS } from "./shared/TransactionConstants";
import { CreditCardService } from "../CreditCardService";

dayjs.extend(timezone);

export class InvoiceTransactionService {
    private static readonly ERROR_MESSAGES = {
        ...TRANSACTION_CONSTANTS.ERROR_MESSAGES,
        INVOICE_MUST_BE_UNPAID: "Transações do tipo INVOICE não podem ser criadas como pagas (isPaid deve ser false)",
        CREDIT_CARD_NOT_FOUND: "Cartão de crédito não encontrado",
        VALUE_EXCEEDS_LIMIT: "O valor da parcela não pode ser maior que o limite do cartão de crédito",
        INSTALLMENT_ID_REQUIRED: "Identificador do parcelamento não informado",
        NO_TRANSACTIONS_FOUND: "Nenhuma transação encontrada para esse parcelamento",
        CANNOT_DELETE_PAID_INSTALLMENTS: "Não é possível deletar: uma ou mais parcelas já foram pagas",
        CANNOT_UPDATE_INVOICE_TYPE: "Só é permitido atualizar transações do tipo INVOICE",
        CANNOT_UPDATE_PAID_INSTALLMENTS: "Não é possível alterar: uma ou mais parcelas que já foram pagas",
        INVOICE_RANGE_PAST: "Só é permitido inserir transações em faturas do ciclo anterior em diante",
        INVOICE_RANGE_FUTURE: "Só é permitido inserir transações em faturas de até 2 ciclos à frente",
        INVOICE_ALREADY_PAID: "Não é possível adicionar transação em uma fatura já paga",
        CREDIT_LIMIT_EXCEEDED: "Não é possível adicionar esta transação: o limite disponível da fatura seria excedido",
        FIELD_NOT_ALLOWED: (field: string) => `Não é permitido alterar o campo '${field}' em transações do tipo INVOICE`,
    };

    private static readonly TIMEZONE = TRANSACTION_CONSTANTS.TIMEZONE;

    static async create(uid: string, data: TransactionRequestDTO): Promise<void> {
        const validatedData = this.validateTransactionData(data);
        if (validatedData.isPaid !== false) {
            throw new Error(this.ERROR_MESSAGES.INVOICE_MUST_BE_UNPAID);
        }

        await this.validateBankAccountExists(uid, validatedData.bankAccountId);

        const card = await this.getCreditCard(uid, validatedData.creditCardId!);

        const installments = this.calculateInstallments(validatedData);
        const totalAmount = installments.count * installments.valuePerInstallment;
        await CreditCardService.reserveCredit(uid, card.id, totalAmount);
        try {
            const transactions = await this.createInstallmentTransactions(uid, validatedData, card, installments);
            await TransactionRepository.createMany(uid, transactions);
        } catch (error) {
            await CreditCardService.releaseCredit(uid, card.id, totalAmount);
            throw error;
        }
    }

    static async deleteInvoiceTransaction(uid: string, primaryTransactionId: string): Promise<void> {
        if (!primaryTransactionId) {
            throw new Error(this.ERROR_MESSAGES.INSTALLMENT_ID_REQUIRED);
        }

        const relatedTransactions = await TransactionRepository.getAllByPrimaryTransactionId(
            uid,
            primaryTransactionId
        );

        if (relatedTransactions.length === 0) {
            throw new Error(this.ERROR_MESSAGES.NO_TRANSACTIONS_FOUND);
        }

        if (relatedTransactions.some((t) => t.isPaid)) {
            throw new Error(this.ERROR_MESSAGES.CANNOT_DELETE_PAID_INSTALLMENTS);
        }

        for (const transaction of relatedTransactions) {
            if (transaction.creditCardId) {
                await CreditCardService.releaseCredit(uid, transaction.creditCardId, transaction.value);
            }

            if (transaction.invoiceId && transaction.creditCardId) {
                await this.restoreCreditLimit(uid, transaction);
            }
        }

        await TransactionRepository.batchDelete(
            uid,
            relatedTransactions.map((t) => t.id)
        );
    }

    static async getAllInvoices(uid: string) {
        const cards = await CreditCardRepository.getAll(uid);

        for (const card of cards) {
            await CreditCardInvoiceService.checkAndUpdateInvoicesStatus(uid, card.id);
        }

        return await TransactionRepository.getAllInvoices(uid);
    }

    static async updateInvoiceTransactions(uid: string, data: TransactionRequestDTO): Promise<void> {
        const validatedData = this.validateTransactionData(data);

        const transactions = await TransactionRepository.getAllByPrimaryTransactionId(
            uid,
            validatedData.primaryTransactionId!
        );

        if (!transactions.length) {
            throw new Error(this.ERROR_MESSAGES.NO_TRANSACTIONS_FOUND);
        }

        if (!transactions.every((t) => t.type === "INVOICE")) {
            throw new Error(this.ERROR_MESSAGES.CANNOT_UPDATE_INVOICE_TYPE);
        }

        if (transactions.some((t) => t.isPaid)) {
            throw new Error(this.ERROR_MESSAGES.CANNOT_UPDATE_PAID_INSTALLMENTS);
        }

        this.validateInvoiceUpdateFields(transactions[0], validatedData);

        if (validatedData.value !== undefined && validatedData.value !== transactions[0].value) {
            await this.updateInvoiceTotalsForValueChange(uid, transactions, validatedData.value);
        }

        const updates = transactions.map((t) => ({
            id: t.id,
            data: {
                name: validatedData.name,
                value: validatedData.value,
                category: validatedData.category,
            },
        }));

        await TransactionRepository.batchUpdate(uid, updates);
    }

    static async payInvoiceInstallment(uid: string, transactionId: string): Promise<void> {
        const transaction = await TransactionRepository.get(uid, transactionId);
        if (!transaction) {
            throw new Error("Transação não encontrada");
        }

        if (transaction.type !== "INVOICE") {
            throw new Error("Transação não é do tipo INVOICE");
        }

        if (transaction.isPaid) {
            throw new Error("Transação já está paga");
        }

        await TransactionRepository.update(uid, transactionId, {
            ...transaction,
            isPaid: true
        });
    }

    private static calculateInstallments(data: TransactionRequestDTO): { count: number; valuePerInstallment: number } {
        let installmentCount = 1;

        if (data.isRecurring && data.endDate) {
            const startDate = dayjs.tz(data.date, this.TIMEZONE);
            const endDate = dayjs.tz(data.endDate, this.TIMEZONE);

            if (endDate.isAfter(startDate, "day")) {
                installmentCount = endDate.diff(startDate, "month") + 1;
            }
        }
        const valuePerInstallment = Math.round((data.value / installmentCount) * 100) / 100;
        return {
            count: installmentCount,
            valuePerInstallment
        };
    }

    private static async createInstallmentTransactions(
        uid: string,
        data: TransactionRequestDTO,
        card: CreditCard,
        installments: { count: number; valuePerInstallment: number }
    ): Promise<Transaction[]> {
        const transactions: Transaction[] = [];
        const startDate = dayjs.tz(data.date, this.TIMEZONE);

        const primaryTransactionId = db
            .collection("users")
            .doc(uid)
            .collection("transactions")
            .doc().id;

        for (let i = 0; i < installments.count; i++) {
            const installmentDate = startDate.add(i, "month");

            const installmentData = {
                ...data,
                date: installmentDate.toISOString(),
                value: installments.valuePerInstallment,
            };

            const invoiceId = await this.getOrCreateInvoiceForTransaction(
                uid,
                installmentData,
                i === 0,
                card
            );

            const transactionId = db
                .collection("users")
                .doc(uid)
                .collection("transactions")
                .doc().id;

            let transaction: any = {
                id: transactionId,
                name: data.name,
                category: data.category,
                value: installments.valuePerInstallment,
                date: installmentDate.toDate(),
                type: "INVOICE",
                isRecurring: false,
                isPaid: false,
                currency: data.currency,
                bankAccountId: data.bankAccountId,
                invoiceId: invoiceId,
                creditCardId: data.creditCardId,
                startDate: undefined,
                endDate: undefined,
                frequency: undefined,
                primaryTransactionId,
            };

            Object.keys(transaction).forEach(
                (key) => transaction[key] === undefined && delete transaction[key]
            );
            transaction = transaction as Transaction;

            transactions.push(transaction);
        }

        return transactions;
    }

    private static async getOrCreateInvoiceForTransaction(
        uid: string,
        data: TransactionRequestDTO,
        validateRange: boolean = true,
        card: CreditCard
    ): Promise<string> {
        const transDate = dayjs.tz(data.date, this.TIMEZONE);
        const now = dayjs().tz(this.TIMEZONE);
        const closingDay = card.closingDay;

        let invoiceClosing = transDate.clone().date(closingDay);
        if (transDate.date() > closingDay) {
            invoiceClosing = invoiceClosing.add(1, "month");
        }
        const invoiceMonth = invoiceClosing.month() + 1;
        const invoiceYear = invoiceClosing.year();

        let currentClosing = now.clone().date(closingDay);
        if (now.date() > closingDay) {
            currentClosing = currentClosing.add(1, "month");
        }
        const currentInvoiceMonth = currentClosing.month() + 1;
        const currentInvoiceYear = currentClosing.year();

        const diffMonths =
            (invoiceYear - currentInvoiceYear) * 12 +
            (invoiceMonth - currentInvoiceMonth);

        if (validateRange) {
            if (diffMonths < -1) {
                throw new Error(this.ERROR_MESSAGES.INVOICE_RANGE_PAST);
            }
            if (diffMonths > 2) {
                throw new Error(this.ERROR_MESSAGES.INVOICE_RANGE_FUTURE);
            }
        }

        const invoices = await CreditCardInvoiceRepository.getAll(uid, card.id);
        let invoice = invoices.find(
            (i) => i.month === invoiceMonth && i.year === invoiceYear
        );

        if (!invoice) {
            let status: InvoiceStatus = InvoiceStatus.OPEN;

            if (diffMonths < 0) {
                status = InvoiceStatus.CLOSED;
            } else if (diffMonths === 0) {
                status = transDate.date() > card.closingDay
                    ? InvoiceStatus.OPEN
                    : InvoiceStatus.CLOSED;
            }

            const invoiceId = db
                .collection("users")
                .doc(uid)
                .collection("transactions")
                .doc().id;

            invoice = {
                id: invoiceId,
                status,
                total: 0,
                month: invoiceMonth,
                year: invoiceYear,
                bankAccountId: null,
            };

            await CreditCardInvoiceRepository.create(uid, card.id, invoice);
        }

        if (invoice.status === InvoiceStatus.PAID) {
            throw new Error(this.ERROR_MESSAGES.INVOICE_ALREADY_PAID);
        }

        const newTotal = (invoice.total ?? 0) + data.value;

        if (newTotal > card.limit) {
            throw new Error(this.ERROR_MESSAGES.CREDIT_LIMIT_EXCEEDED);
        }

        await CreditCardInvoiceRepository.update(uid, card.id, invoice.id, {
            total: newTotal,
        });

        return invoice.id;
    }

    private static async restoreCreditLimit(uid: string, transaction: Transaction): Promise<void> {
        if (!transaction.invoiceId || !transaction.creditCardId) return;

        const invoices = await CreditCardInvoiceRepository.getAll(uid, transaction.creditCardId);
        const invoice = invoices.find((i) => i.id === transaction.invoiceId);

        if (invoice) {
            await CreditCardInvoiceRepository.update(
                uid,
                transaction.creditCardId,
                invoice.id,
                { total: (invoice.total ?? 0) + transaction.value }
            );
        }
    }

    private static validateInvoiceUpdateFields(
        originalTransaction: Transaction,
        updateData: TransactionRequestDTO
    ): void {
        const allowedFields = ["name", "value", "category"];
        const dateFields = ["date", "startDate", "endDate"];
        const ignoredFields = [...dateFields, "invoiceId"];

        for (const field of Object.keys(originalTransaction)) {
            if (
                !allowedFields.includes(field) &&
                !ignoredFields.includes(field)
            ) {
                const originalValue = (originalTransaction as any)[field];
                const newValue = (updateData as any)[field];

                if (
                    newValue !== undefined &&
                    newValue !== null &&
                    String(newValue) !== String(originalValue)
                ) {
                    throw new Error(this.ERROR_MESSAGES.FIELD_NOT_ALLOWED(field));
                }
            }
        }
    }

    private static async updateInvoiceTotalsForValueChange(
        uid: string,
        transactions: Transaction[],
        newValue: number
    ): Promise<void> {
        for (const transaction of transactions) {
            if (transaction.invoiceId && transaction.creditCardId) {
                const invoices = await CreditCardInvoiceRepository.getAll(
                    uid,
                    transaction.creditCardId
                );
                const invoice = invoices.find((i) => i.id === transaction.invoiceId);

                if (invoice) {
                    const newTotal = (invoice.total ?? 0) + transaction.value - newValue;
                    await CreditCardInvoiceRepository.update(
                        uid,
                        transaction.creditCardId,
                        invoice.id,
                        { total: newTotal }
                    );
                }
            }
        }
    }

    private static async getCreditCard(uid: string, creditCardId: string): Promise<CreditCard> {
        const cards = await CreditCardRepository.getAll(uid);
        const card = cards.find((c) => c.id === creditCardId);

        if (!card) {
            throw new Error(this.ERROR_MESSAGES.CREDIT_CARD_NOT_FOUND);
        }

        return card;
    }

    private static async validateBankAccountExists(uid: string, bankAccountId: string): Promise<void> {
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

    private static async validateInstallmentSeries(
        uid: string,
        card: CreditCard,
        installments: { count: number; valuePerInstallment: number }
    ): Promise<void> {
        const totalCommitment = installments.count * installments.valuePerInstallment;
        const availableLimit = await CreditCardService.getAvailableLimit(uid, card.id);

        if (totalCommitment > availableLimit) {
            throw new Error(`Installment series exceeds available limit. Need: ${totalCommitment}, Available: ${availableLimit}`);
        }
    }
}

