import { UserStatus } from "../enums/UserStatus";
import { BankAccount } from "./BankAccount";
import { CreditCard } from "./CreditCard";
import { Category } from "./Category";
import { FinancialObjective } from "../enums/FinancialObjective";

export interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  cellphone: string;
  address: string;
  birthDate: Date;
  CPF: string;
  financialObjective: FinancialObjective; // Pode virar ENUM
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  categories: Category[];
}
