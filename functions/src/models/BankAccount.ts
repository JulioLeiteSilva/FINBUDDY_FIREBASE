import { AccountType } from "../enums/AccountType";
import { Transaction } from "./Transaction";

export interface BankAccount {
  id: string;
  name: string;
  type: AccountType;
  bank: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface BankAccountWithTransactions extends BankAccount {
  transactions: Transaction[];
}
