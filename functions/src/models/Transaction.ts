export interface Transaction {
  id: string;
  name: string;
  category: string;
  value: number;
  date: Date;
  type: "INCOME" | "EXPENSE";
  isRecurring: boolean;
  frequency: string;
  startDate: Date;
  endDate: Date;
  isPaid: boolean;
  currency: string;
}
