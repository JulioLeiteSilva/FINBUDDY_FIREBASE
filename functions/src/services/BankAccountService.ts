import { db } from "../config/firebase";
import { CreateBankAccountDTO, CreateBankAccountSchema } from "../dto/BankAccountDTO";
import { UpdateBankAccountDTO, UpdateBankAccountSchema } from "../dto/BankAccountDTO";
import { BankAccountRepository } from "../repositories/BankAccountRepository";
import { BankAccount } from "../models/BankAccount";
import { z } from "zod";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { BankAccountBalancesByMonthRequestDTO, BankAccountBalancesByMonthRequestSchema } from "../dto/BankAccountBalancesByMonthRequestDTO";
import { BankAccountBalancesByMonthResponseDTO, BankAccountWithBalances } from "../dto/BankAccountBalancesByMonthResponseDTO";
import { Transaction } from "../models/Transaction";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { CreditCardRepository } from "../repositories/CreditCardRepository";
import { CreditCardInvoiceRepository } from "../repositories/CreditCardInvoiceRepository";
import { CreditCard } from "../models/CreditCard";
import { CreditCardInvoice } from "../models/CreditCardInvoice";
import { firestoreTimestampToDayjs } from "../utils/firestoreUtils";
import { InvoiceStatus } from "../enums/InvoiceStatus";

dayjs.extend(utc);
dayjs.extend(timezone);

export class BankAccountService {
  private static readonly ERROR_MESSAGES = {
    ACCOUNT_NOT_FOUND: "Conta bancária não encontrada",
    ACCOUNT_EXISTS: "Já existe uma conta com este nome",
    HAS_TRANSACTIONS: "Não é possível deletar conta com transações vinculadas",
    INSUFFICIENT_BALANCE: "Saldo insuficiente",
  };

  static async create(uid: string, data: CreateBankAccountDTO): Promise<BankAccount> {
    const validatedData = CreateBankAccountSchema.parse(data);
    const existingAccounts = await BankAccountRepository.getAll(uid);
    const nameExists = existingAccounts.some(
      account => account.name.toLowerCase() === validatedData.name.toLowerCase()
    );

    if (nameExists) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_EXISTS);
    }

    const id = db
      .collection("users")
      .doc(uid)
      .collection("bankAccounts")
      .doc().id;

    const accountData: BankAccount = {
      ...validatedData,
      id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    return await BankAccountRepository.create(uid, accountData);
  }

  static async update(uid: string, accountId: string, data: UpdateBankAccountDTO): Promise<BankAccount> {
    const validatedData = UpdateBankAccountSchema.parse(data);
    const existing = await BankAccountRepository.get(uid, accountId);
    if (!existing) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    if (validatedData.name) {
      const existingAccounts = await BankAccountRepository.getAll(uid);
      const nameExists = existingAccounts.some(
        account =>
          account.id !== accountId &&
          account.name.toLowerCase() === validatedData.name!.toLowerCase()
      );

      if (nameExists) {
        throw new Error(this.ERROR_MESSAGES.ACCOUNT_EXISTS);
      }
    }
    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
    };

    return await BankAccountRepository.update(uid, accountId, updateData);
  }

  static async updateBalance(uid: string, accountId: string, newBalance: number): Promise<BankAccount> {
    const existing = await BankAccountRepository.get(uid, accountId);
    if (!existing) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    return await BankAccountRepository.update(uid, accountId, {
      balance: newBalance,
      updatedAt: new Date(),
    });
  }

  static async delete(uid: string, accountId: string): Promise<void> {
    const existing = await BankAccountRepository.get(uid, accountId);
    if (!existing) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_NOT_FOUND);
    }

    await BankAccountRepository.delete(uid, accountId);
  }

  static async get(uid: string, accountId: string): Promise<BankAccount> {
    const account = await BankAccountRepository.get(uid, accountId);
    if (!account) {
      throw new Error(this.ERROR_MESSAGES.ACCOUNT_NOT_FOUND);
    }
    return account;
  }

  static async getAll(uid: string): Promise<BankAccount[]> {
    return await BankAccountRepository.getAll(uid);
  }

  static async getBalancesByMonth(uid: string, data: BankAccountBalancesByMonthRequestDTO): Promise<BankAccountBalancesByMonthResponseDTO> {
    const validatedData = this.validateBalancesByMonthData(data);

    const [yearStr, monthStr] = validatedData.month.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;

    const requestedDate = dayjs().year(year).month(month).date(1).tz("America/Sao_Paulo");
    const currentDate = dayjs().tz("America/Sao_Paulo");
    const monthType = this.determineMonthType(requestedDate, currentDate);

    const accounts = await BankAccountRepository.getAll(uid);

    switch (monthType) {
      case 'CURRENT':
        return await this.calculateCurrentMonthBalances(uid, accounts);
      case 'PAST':
        return await this.calculatePastMonthBalances(uid, accounts, requestedDate);
      case 'FUTURE':
        return await this.calculateFutureMonthBalances(uid, accounts, requestedDate);
      default:
        throw new Error("Invalid month type");
    }
  }

  private static validateBalancesByMonthData(data: BankAccountBalancesByMonthRequestDTO): BankAccountBalancesByMonthRequestDTO {
    try {
      return BankAccountBalancesByMonthRequestSchema.parse(data);
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

  private static determineMonthType(requestedDate: dayjs.Dayjs, currentDate: dayjs.Dayjs): 'CURRENT' | 'PAST' | 'FUTURE' {
    const requestedMonth = requestedDate.format('YYYY-MM');
    const currentMonth = currentDate.format('YYYY-MM');

    if (requestedMonth === currentMonth) return 'CURRENT';
    if (requestedDate.isBefore(currentDate, 'month')) return 'PAST';
    return 'FUTURE';
  }

  private static async calculateCurrentMonthBalances(uid: string, accounts: BankAccount[]): Promise<BankAccountBalancesByMonthResponseDTO> {
    const accountsWithBalances: BankAccountWithBalances[] = [];
    let totalBalance = 0;
    let forecastTotalBalance = 0;

    for (const account of accounts) {
      const currentBalance = account.balance;
      totalBalance += currentBalance;

      const forecastNet = await this.calculateForecastNetForAccount(uid, account.id);
      const forecastBalance = currentBalance + forecastNet;
      forecastTotalBalance += forecastBalance;

      accountsWithBalances.push({
        ...account,
        forecastBankAccountBalance: forecastBalance
      });

    }

    return {
      accounts: accountsWithBalances,
      totalBalance,
      forecastTotalBalance
    };
  }

  private static async calculatePastMonthBalances(uid: string, accounts: BankAccount[], requestedDate: dayjs.Dayjs): Promise<BankAccountBalancesByMonthResponseDTO> {
    const accountsWithBalances: BankAccountWithBalances[] = [];
    let pastMonthTotalBalance = 0;

    for (const account of accounts) {
      const monthlyNet = await this.calculateMonthlyNetForAccount(uid, account.id, requestedDate);
      pastMonthTotalBalance += monthlyNet;

      accountsWithBalances.push({
        ...account,
        pastMonthBankAccountBalance: monthlyNet
      });
    }

    return {
      accounts: accountsWithBalances,
      pastMonthTotalBalance
    };
  }

  private static async calculateFutureMonthBalances(uid: string, accounts: BankAccount[], requestedDate: dayjs.Dayjs): Promise<BankAccountBalancesByMonthResponseDTO> {
    const currentDate = dayjs().tz("America/Sao_Paulo");
    const nextMonth = currentDate.add(1, 'month');

    if (!requestedDate.isSame(nextMonth, 'month')) {
      throw new Error("Forecast is only available for the next month");
    }

    const accountsWithBalances: BankAccountWithBalances[] = [];
    let forecastTotalBalance = 0;

    for (const account of accounts) {
      const currentBalance = account.balance;
      const recurringNet = await this.calculateFutureNetForAccount(uid, account.id, requestedDate);
      const forecastBalance = currentBalance + recurringNet;
      forecastTotalBalance += forecastBalance;

      accountsWithBalances.push({
        ...account,
        forecastBankAccountBalance: forecastBalance
      });
    }

    return {
      accounts: accountsWithBalances,
      forecastTotalBalance
    };
  }

  private static async calculateForecastNetForAccount(uid: string, accountId: string): Promise<number> {
    const currentMonth = dayjs().tz("America/Sao_Paulo");

    const transactions = await TransactionRepository.getAll(uid);
    const forecastTransactions = transactions.filter(t => {
      if (t.bankAccountId !== accountId || t.isPaid) return false;

      const transactionDate = firestoreTimestampToDayjs(t.date);
      if (!transactionDate) return false;

      return transactionDate.tz("America/Sao_Paulo").isSame(currentMonth, 'month');
    });

    const transactionNet = this.calculateNetFromTransactions(forecastTransactions);

    const invoicePayments = await this.calculateInvoicePaymentsForAccount(uid, accountId, currentMonth);

    console.log(`Current month forecast - Transaction net: ${transactionNet}, Invoice payments: ${invoicePayments}`);
    return transactionNet - invoicePayments;
  }

  private static async calculateMonthlyNetForAccount(uid: string, accountId: string, month: dayjs.Dayjs): Promise<number> {
    const transactions = await TransactionRepository.getAll(uid);

    const monthlyTransactions = transactions.filter(t => {
      if (t.bankAccountId !== accountId || !t.isPaid) return false;

      const transactionDate = firestoreTimestampToDayjs(t.date);
      if (!transactionDate) return false;

      return transactionDate.tz("America/Sao_Paulo").isSame(month, 'month');
    });

    return this.calculateNetFromTransactions(monthlyTransactions);
  }

  private static async calculateFutureNetForAccount(uid: string, accountId: string, month: dayjs.Dayjs): Promise<number> {
    const transactions = await TransactionRepository.getAll(uid);

    const futureTransactions = transactions.filter(t => {
      if (t.bankAccountId !== accountId || t.isPaid) return false;

      const transactionDate = firestoreTimestampToDayjs(t.date);
      if (!transactionDate) return false;

      const transactionDateTz = transactionDate.tz("America/Sao_Paulo");

      if (transactionDateTz.isSame(month, 'month')) return true;
      if (t.isRecurring) {
        return this.isRecurringTransactionActiveInMonth(t, month, transactionDateTz);
      }
      return false;
    });

    const transactionNet = this.calculateNetFromTransactions(futureTransactions);

    const invoicePayments = await this.calculateInvoicePaymentsForAccount(uid, accountId, month);

    console.log(`Future month ${month.format('YYYY-MM')} - Transaction net: ${transactionNet}, Invoice payments: ${invoicePayments}`);

    return transactionNet - invoicePayments;
  }

  private static async calculateInvoicePaymentsForAccount(uid: string, accountId: string, month: dayjs.Dayjs): Promise<number> {
    const cards = await CreditCardRepository.getAll(uid);
    let totalInvoicePayments = 0;

    for (const card of cards) {
      if (card.bankAccountId !== accountId) continue;

      const invoices = await CreditCardInvoiceRepository.getAll(uid, card.id);

      const unpaidInvoices = invoices.filter(invoice => {
        if (invoice.status === InvoiceStatus.PAID) return false;

        const dueDate = this.calculateInvoiceDueDate(card, invoice);
        return dueDate.isSame(month, 'month');
      });

      totalInvoicePayments += unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);

      console.log(`Found ${unpaidInvoices.length} unpaid invoices for account ${accountId} in ${month.format('YYYY-MM')}`);
    }

    return totalInvoicePayments;
  }

  private static calculateInvoiceDueDate(card: CreditCard, invoice: CreditCardInvoice): dayjs.Dayjs {
    return dayjs()
      .year(invoice.year)
      .month(invoice.month - 1)
      .date(card.dueDate)
      .tz("America/Sao_Paulo");
  }

  private static calculateNetFromTransactions(transactions: Transaction[]): number {
    const Net = transactions.reduce((net, t) => {
      if (t.type === 'INCOME') return net + t.value;
      if (t.type === 'EXPENSE') return net - t.value;
      return net;
    }, 0);
    return Net
  }

  private static isRecurringTransactionActiveInMonth(transaction: Transaction, month: dayjs.Dayjs, transactionDate?: dayjs.Dayjs): boolean {
    const txDate = transactionDate || firestoreTimestampToDayjs(transaction.date);
    if (!txDate) return false;

    const transactionDateTz = txDate.tz("America/Sao_Paulo");

    if (transactionDateTz.isSame(month, 'month')) {
      return true;
    }

    if (transaction.frequency === 'MONTHLY') {
      return transactionDateTz.isBefore(month, 'month') || transactionDateTz.isSame(month, 'month');
    }

    return false;
  }
}
