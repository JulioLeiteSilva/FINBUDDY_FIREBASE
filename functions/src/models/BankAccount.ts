import { AccountType } from "../enums/AccountType";
import { Transaction } from "./Transaction";

export interface BankAccount {
  id: string;
  name: string;
  type: AccountType;
  bank: string;
  balance: number;
  transactions: Transaction[];
  currency: string;
}
