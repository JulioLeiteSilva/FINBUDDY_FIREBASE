import { CreditCardFlag } from "../enums/CreditCardFlag";

export interface CreditCard {
  id: string;
  name: string;
  flag: CreditCardFlag;
  closingDay: number;
  dueDate: number;
  limit: number;
  bankAccountId: string;
  
}
