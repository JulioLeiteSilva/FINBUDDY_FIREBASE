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
import { CreditCardInvoiceRepository } from "../repositories/CreditCardInvoiceRepository";
import { CreditCardRepository } from "../repositories/CreditCardRepository";
import { InvoiceStatus } from "../enums/InvoiceStatus";
import { CreditCardInvoiceService } from "./CreditCardInvoiceService";

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

  static async createIncomeOrExpenseTransaction(
    uid: string,
    data: TransactionRequestDTO
  ) {
    await this.validateBankAccountExists(uid, data.bankAccountId);

    // --- NÃO RECORRENTE ---
    if (!data.isRecurring) {
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
        date: this.formatDate(data.date),
        type: data.type,
        isRecurring: false,
        isPaid: data.isPaid,
        currency: data.currency,
        bankAccountId: data.bankAccountId,
        frequency: undefined,
        startDate: undefined,
        endDate: undefined,
      };
      Object.keys(transaction).forEach(
        (key) => transaction[key] === undefined && delete transaction[key]
      );
      transaction = transaction as Transaction;

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

    // --- RECORRENTE ---
    const transactions: Transaction[] = [];
    let currentDate: dayjs.Dayjs = dayjs.utc(data.date, this.TIMEZONE);
    const endDate: dayjs.Dayjs = dayjs.utc(data.endDate, this.TIMEZONE);

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
        date: currentDate.toDate(),
        isRecurring: true,
        frequency: data.frequency,
        isPaid: transactions.length === 0 ? data.isPaid : false,
        currency: data.currency,
        bankAccountId: data.bankAccountId,
        type: data.type,
        startDate: this.formatDate(data.startDate!),
        endDate: endDate.toDate(),
      };
      Object.keys(transaction).forEach(
        (key) => transaction[key] === undefined && delete transaction[key]
      );
      transaction = transaction as Transaction;

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

  static async createInvoiceTransaction(
    uid: string,
    data: TransactionRequestDTO
  ) {
    // Validação: INVOICE nunca pode ser criada como paga
    if (data.isPaid !== false) {
      throw new Error(
        "Transações do tipo INVOICE não podem ser criadas como pagas (isPaid deve ser false)."
      );
    }

    await this.validateBankAccountExists(uid, data.bankAccountId);

    // --- PARCELAMENTO ---
    let parcelas = 1;
    let startDate = dayjs.utc(data.date, this.TIMEZONE);
    let endDate = data.endDate
      ? dayjs.utc(data.endDate, this.TIMEZONE)
      : startDate;

    if (endDate.isAfter(startDate, "day")) {
      parcelas = endDate.diff(startDate, "month") + 1;
    }

    const valorParcela = data.value / parcelas;
    const transactions: Transaction[] = [];

    const primaryTransactionId = db
      .collection("users")
      .doc(uid)
      .collection("transactions")
      .doc().id;

    for (let i = 0; i < parcelas; i++) {
      const parcelaDate = startDate.add(i, "month");
      const parcelaData = { ...data, date: parcelaDate.toISOString() };
      // Só valida o range para a primeira parcela
      parcelaData.invoiceId = await this.getOrCreateInvoiceForTransaction(
        uid,
        parcelaData,
        i === 0 // true só para a primeira parcela
      );

      const id = db
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc().id;

      let transaction: any = {
        id,
        name: data.name,
        category: data.category,
        value: valorParcela,
        date: parcelaDate.toDate(),
        type: "INVOICE",
        isRecurring: false,
        isPaid: false, // Sempre false para INVOICE!
        currency: data.currency,
        bankAccountId: data.bankAccountId,
        invoiceId: parcelaData.invoiceId,
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

    await TransactionRepository.createMany(uid, transactions);
  }

  static async update(
    uid: string,
    transactionId: string,
    data: TransactionRequestDTO
  ): Promise<void> {
    const transaction = await TransactionRepository.get(uid, transactionId);

    if (!transaction) {
      throw new Error("não encontrado");
    }

    if (transaction.type === "INVOICE") {
      throw new Error("Não é permitido atualizar transações do tipo INVOICE.");
    }

    if (
      transaction.isRecurring &&
      data.date &&
      dayjs(data.date).toISOString() !== dayjs(transaction.date).toISOString()
    ) {
      throw new Error(
        "Não é permitido alterar a data de transações recorrentes."
      );
    }

    await this.validateBankAccountExists(uid, data.bankAccountId!);

    const oldIsPaid = transaction.isPaid;
    const newIsPaid = data.isPaid ?? oldIsPaid;

    const oldValue = transaction.value;
    const newValue = data.value ?? oldValue;

    const oldBankAccountId = transaction.bankAccountId;
    const newBankAccountId = data.bankAccountId;
    const bankAccountChanged = newBankAccountId !== oldBankAccountId;

    await TransactionRepository.update(uid, transactionId, data);

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

  static async deleteIncomeOrExpenseTransaction(
    uid: string,
    transactionId: string
  ): Promise<void> {
    const transaction = await TransactionRepository.get(uid, transactionId);
    if (!transaction) {
      throw new Error("Transação não encontrada");
    }

    if (transaction.type === "INVOICE") {
      throw new Error(
        "Use o método específico para deletar transações do tipo INVOICE."
      );
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

  static async deleteInvoiceTransaction(
    uid: string,
    primaryTransactionId: string
  ): Promise<void> {
    if (!primaryTransactionId) {
      throw new Error("Identificador do parcelamento não informado.");
    }

    const related = await TransactionRepository.getAllByPrimaryTransactionId(
      uid,
      primaryTransactionId
    );

    if (related.length === 0) {
      throw new Error("Nenhuma transação encontrada para esse parcelamento.");
    }

    if (related.some((t) => t.isPaid)) {
      throw new Error(
        "Não é possível deletar: uma ou mais parcelas já foram pagas."
      );
    }

    for (const t of related) {
      if (t.invoiceId && t.creditCardId) {
        const invoices = await CreditCardInvoiceRepository.getAll(
          uid,
          t.creditCardId
        );
        const invoice = invoices.find((i) => i.id === t.invoiceId);
        if (invoice) {
          await CreditCardInvoiceRepository.update(
            uid,
            t.creditCardId,
            invoice.id,
            { total: (invoice.total ?? 0) + t.value }
          );
        }
      }
    }
    await TransactionRepository.batchDelete(
      uid,
      related.map((t) => t.id)
    );
  }

  static async getAllIncomeOrExpense(uid: string) {
    const all = await TransactionRepository.getAll(uid);
    return all.filter((t) => t.type === "INCOME" || t.type === "EXPENSE");
  }

  static async getAllInvoices(uid: string) {
    const cards = await CreditCardRepository.getAll(uid);

    // Atualiza o status das faturas de todos os cartões
    for (const card of cards) {
      await CreditCardInvoiceService.checkAndUpdateInvoicesStatus(uid, card.id);
    }

    return await TransactionRepository.getAllInvoices(uid);
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

  private static async getOrCreateInvoiceForTransaction(
    uid: string,
    data: TransactionRequestDTO,
    validateRange: boolean = true
  ) {
    const cards = await CreditCardRepository.getAll(uid);
    const card = cards.find((c) => c.id === data.creditCardId);
    if (!card) throw new Error("Cartão de crédito não encontrado");

    const transDate = dayjs.tz(data.date, this.TIMEZONE);
    const now = dayjs().tz(this.TIMEZONE);

    const closingDay = card.closingDay;

    // Calcula o fechamento da fatura da transação
    let invoiceClosing = transDate.clone().date(closingDay);
    if (transDate.date() > closingDay) {
      invoiceClosing = invoiceClosing.add(1, "month");
    }
    let invoiceMonth = invoiceClosing.month() + 1;
    let invoiceYear = invoiceClosing.year();

    // Calcula o fechamento da fatura atual
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
        throw new Error(
          "Só é permitido inserir transações em faturas do ciclo anterior em diante."
        );
      }
      if (diffMonths > 2) {
        throw new Error(
          "Só é permitido inserir transações em faturas de até 2 ciclos à frente."
        );
      }
    }

    // Busca fatura existente
    let invoices = await CreditCardInvoiceRepository.getAll(uid, card.id);
    let invoice = invoices.find(
      (i) => i.month === invoiceMonth && i.year === invoiceYear
    );

    if (invoice && invoice.status === InvoiceStatus.PAID) {
      throw new Error(
        "Não é possível adicionar transação em uma fatura já paga."
      );
    }

    // Se não existe, cria a fatura
    if (!invoice) {
      let status: InvoiceStatus = InvoiceStatus.OPEN;

      if (diffMonths < 0) {
        status = InvoiceStatus.CLOSED;
      } else if (diffMonths === 0) {
        status =
          transDate.date() > card.closingDay
            ? InvoiceStatus.OPEN
            : InvoiceStatus.CLOSED;
      }
      // Futuro: mantém OPEN

      const id = db
        .collection("users")
        .doc(uid)
        .collection("transactions")
        .doc().id;

      invoice = {
        id: id,
        status,
        total: card.limit,
        month: invoiceMonth,
        year: invoiceYear,
        bankAccountId: null,
      };
      await CreditCardInvoiceRepository.create(uid, card.id, invoice);
    }

    // Atualiza o total da fatura
    const novoTotal = (invoice.total ?? card.limit) - data.value;
    await CreditCardInvoiceRepository.update(uid, card.id, invoice.id, {
      total: novoTotal,
    });

    return invoice.id;
  }
}
