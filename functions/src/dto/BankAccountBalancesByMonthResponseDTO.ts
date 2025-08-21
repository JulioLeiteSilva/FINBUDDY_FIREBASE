import { BankAccount } from "../models/BankAccount";

export interface BankAccountWithBalances extends BankAccount {
    // Conditional fields based on month type:
    forecastBankAccountBalance?: number;  // Current/next month
    pastMonthBankAccountBalance?: number; // Past months
}

export interface BankAccountBalancesByMonthResponseDTO {
    accounts: BankAccountWithBalances[];
    totalBalance?: number;           // Current month only
    forecastTotalBalance?: number;   // Current/next month only
    pastMonthTotalBalance?: number;  // Past months only
}