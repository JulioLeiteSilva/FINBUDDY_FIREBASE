import { Category } from "./Category";

export interface FinancialPlanning {
    id: string;
    monthlyIncome: number;
    budgetAmount: number;
    allocatedAmount: number;
    categoryAllocations: {
        categoryId: string;
        value: number;
    }[];
    month: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface FinancialPlanningWithCategories extends Omit<FinancialPlanning, 'categoryAllocations'> {
    categoryAllocations: {
        category: Category;
        value: number;
        spent?: number;
        paidSpent?: number;
        unpaidSpent?: number;
        remaining?: number;
        percentUsed?: number;
        percentPaidUsed?: number;
        percentUnpaidUsed?: number;
    }[];
    totalSpent?: number;
    totalPaidSpent?: number;
    totalUnpaidSpent?: number;
    remainingBudget?: number;
    percentUsed?: number;
    percentPaidUsed?: number;
    percentUnpaidUsed?: number;
    unallocatedAmount?: number;
}
