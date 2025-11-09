import { db } from "../config/firebase";
import {
    CreateFinancialPlanningRequestDTO,
    CreateFinancialPlanningSchema,
    CopyFinancialPlanningRequestDTO,
    CopyFinancialPlanningSchema,
    GetFinancialPlanningRequestDTO,
    GetFinancialPlanningSchema,
    UpdateFinancialPlanningRequestDTO,
    UpdateFinancialPlanningSchema,
    DeleteFinancialPlanningRequestDTO,
    DeleteFinancialPlanningSchema,
    RemoveCategoryAllocationRequestDTO,
    RemoveCategoryAllocationSchema
} from "../dto/FinancialPlanningDTO";
import { FinancialPlanning, FinancialPlanningWithCategories } from "../models/FinancialPlanning";
import { FinancialPlanningRepository } from "../repositories/FinancialPlanningRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { z } from "zod";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { FirestoreTimestamp } from "../utils/firestoreUtils";

dayjs.extend(utc);
dayjs.extend(timezone);

export class FinancialPlanningService {
    private static readonly ERROR_MESSAGES = {
        PLANNING_NOT_FOUND: "Planejamento financeiro não encontrado",
        SOURCE_PLANNING_NOT_FOUND: "Planejamento financeiro de origem não encontrado",
        CATEGORY_NOT_FOUND: "Uma ou mais categorias não foram encontradas",
        BUDGET_EXCEEDED: "O valor alocado excede o orçamento disponível",
        MONTH_ALREADY_EXISTS: "Já existe um planejamento financeiro para este mês",
    };

    private static readonly TIMEZONE = "America/Sao_Paulo";

    static async create(uid: string, data: CreateFinancialPlanningRequestDTO): Promise<FinancialPlanningWithCategories> {
        try {
            const validatedData = CreateFinancialPlanningSchema.parse(data);

            const [year, month] = validatedData.month.split('-').map(Number);
            const monthDate = dayjs()
                .tz(this.TIMEZONE)
                .year(year)
                .month(month - 1)
                .date(1)
                .hour(12)
                .minute(0)
                .second(0)
                .millisecond(0)
                .toDate();

            const existingPlanning = await FinancialPlanningRepository.getByMonth(uid, year, month);
            if (existingPlanning) {
                throw new Error(this.ERROR_MESSAGES.MONTH_ALREADY_EXISTS);
            }

            const budgetAmount = validatedData.budgetAmount;

            const allocatedAmount = validatedData.categoryAllocations.reduce(
                (total, allocation) => total + allocation.value,
                0
            );

            if (allocatedAmount > budgetAmount) {
                throw new Error(this.ERROR_MESSAGES.BUDGET_EXCEEDED);
            }

            const categoryIds = validatedData.categoryAllocations.map(a => a.categoryId);
            const categories = await CategoryRepository.getByIds(uid, categoryIds);

            if (categories.length !== categoryIds.length) {
                throw new Error(this.ERROR_MESSAGES.CATEGORY_NOT_FOUND);
            }

            const id = db
                .collection("users")
                .doc(uid)
                .collection("financialPlannings")
                .doc().id;

            const now = new Date();

            const financialPlanning: FinancialPlanning = {
                id,
                monthlyIncome: validatedData.monthlyIncome,
                budgetAmount,
                allocatedAmount,
                categoryAllocations: validatedData.categoryAllocations,
                month: monthDate,
                createdAt: now,
                updatedAt: now
            };

            await FinancialPlanningRepository.create(uid, financialPlanning);

            return await this.enrichFinancialPlanningWithCategories(uid, financialPlanning);
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

    static async copyFromMonth(uid: string, data: CopyFinancialPlanningRequestDTO): Promise<FinancialPlanningWithCategories> {
        try {
            const validatedData = CopyFinancialPlanningSchema.parse(data);

            const [sourceYear, sourceMonth] = validatedData.sourceMonth.split('-').map(Number);

            const [targetYear, targetMonth] = validatedData.targetMonth.split('-').map(Number);
            const targetMonthDate = dayjs()
                .tz(this.TIMEZONE)
                .year(targetYear)
                .month(targetMonth - 1)
                .date(1)
                .hour(12)
                .minute(0)
                .second(0)
                .millisecond(0)
                .toDate();

            const existingTargetPlanning = await FinancialPlanningRepository.getByMonth(uid, targetYear, targetMonth);
            if (existingTargetPlanning) {
                throw new Error(this.ERROR_MESSAGES.MONTH_ALREADY_EXISTS);
            }

            const sourcePlanning = await FinancialPlanningRepository.getByMonth(uid, sourceYear, sourceMonth);
            if (!sourcePlanning) {
                throw new Error(this.ERROR_MESSAGES.SOURCE_PLANNING_NOT_FOUND);
            }

            const monthlyIncome = validatedData.adjustments?.monthlyIncome ?? sourcePlanning.monthlyIncome;
            const budgetAmount = validatedData.adjustments?.budgetAmount ?? sourcePlanning.budgetAmount;

            const scaleFactor = budgetAmount / sourcePlanning.budgetAmount;
            const categoryAllocations = sourcePlanning.categoryAllocations.map(allocation => ({
                categoryId: allocation.categoryId,
                value: validatedData.adjustments ? allocation.value * scaleFactor : allocation.value
            }));

            const allocatedAmount = categoryAllocations.reduce(
                (total, allocation) => total + allocation.value,
                0
            );

            const id = db
                .collection("users")
                .doc(uid)
                .collection("financialPlannings")
                .doc().id;

            const now = new Date();

            const financialPlanning: FinancialPlanning = {
                id,
                monthlyIncome,
                budgetAmount,
                allocatedAmount,
                categoryAllocations,
                month: targetMonthDate,
                createdAt: now,
                updatedAt: now
            };

            await FinancialPlanningRepository.create(uid, financialPlanning);

            return await this.enrichFinancialPlanningWithCategories(uid, financialPlanning);
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

    static async getByMonth(uid: string, data: GetFinancialPlanningRequestDTO): Promise<FinancialPlanningWithCategories> {
        try {
            const validatedData = GetFinancialPlanningSchema.parse(data);

            const [year, month] = validatedData.month.split('-').map(Number);

            const financialPlanning = await FinancialPlanningRepository.getByMonth(uid, year, month);
            if (!financialPlanning) {
                throw new Error(this.ERROR_MESSAGES.PLANNING_NOT_FOUND);
            }

            return await this.enrichFinancialPlanningWithSpending(uid, financialPlanning);
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

    static async update(uid: string, data: UpdateFinancialPlanningRequestDTO): Promise<FinancialPlanningWithCategories> {
        try {
            const validatedData = UpdateFinancialPlanningSchema.parse(data);

            const existingPlanning = await FinancialPlanningRepository.getById(uid, validatedData.id);
            if (!existingPlanning) {
                throw new Error(this.ERROR_MESSAGES.PLANNING_NOT_FOUND);
            }

            let monthlyIncome = existingPlanning.monthlyIncome;
            let budgetAmount = existingPlanning.budgetAmount;
            let categoryAllocations = existingPlanning.categoryAllocations;

            if (validatedData.monthlyIncome !== undefined) {
                monthlyIncome = validatedData.monthlyIncome;
            }

            if (validatedData.budgetAmount !== undefined) {
                budgetAmount = validatedData.budgetAmount;
            }

            if (validatedData.categoryAllocations) {
                const categoryIds = validatedData.categoryAllocations.map(a => a.categoryId);
                const categories = await CategoryRepository.getByIds(uid, categoryIds);

                if (categories.length !== categoryIds.length) {
                    throw new Error(this.ERROR_MESSAGES.CATEGORY_NOT_FOUND);
                }

                categoryAllocations = validatedData.categoryAllocations;
            }

            const allocatedAmount = categoryAllocations.reduce(
                (total, allocation) => total + allocation.value,
                0
            );

            if (allocatedAmount > budgetAmount) {
                throw new Error(this.ERROR_MESSAGES.BUDGET_EXCEEDED);
            }

            const updateData: Partial<FinancialPlanning> = {
                monthlyIncome,
                budgetAmount,
                allocatedAmount,
                categoryAllocations,
                updatedAt: new Date()
            };

            await FinancialPlanningRepository.update(uid, validatedData.id, updateData);

            const updatedPlanning = await FinancialPlanningRepository.getById(uid, validatedData.id);
            if (!updatedPlanning) {
                throw new Error(this.ERROR_MESSAGES.PLANNING_NOT_FOUND);
            }

            return await this.enrichFinancialPlanningWithCategories(uid, updatedPlanning);
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

    static async delete(uid: string, data: DeleteFinancialPlanningRequestDTO): Promise<void> {
        try {
            const validatedData = DeleteFinancialPlanningSchema.parse(data);

            const existingPlanning = await FinancialPlanningRepository.getById(uid, validatedData.id);
            if (!existingPlanning) {
                throw new Error(this.ERROR_MESSAGES.PLANNING_NOT_FOUND);
            }

            await FinancialPlanningRepository.delete(uid, validatedData.id);
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

    static async removeCategoryAllocation( uid: string, data: RemoveCategoryAllocationRequestDTO): Promise<FinancialPlanningWithCategories> {
        const validatedData = RemoveCategoryAllocationSchema.parse(data);
        
        const planning = await FinancialPlanningRepository.getById(uid, validatedData.planningId);
        if (!planning) {
            throw new Error(this.ERROR_MESSAGES.PLANNING_NOT_FOUND);
        }

        const allocationToRemove = planning.categoryAllocations.find(a => a.categoryId === validatedData.categoryId);
        if (!allocationToRemove) {
            throw new Error(this.ERROR_MESSAGES.CATEGORY_NOT_FOUND);
        }

        const updatedAllocations = planning.categoryAllocations.filter(a => a.categoryId !== validatedData.categoryId);
        const updatedAllocatedAmount = updatedAllocations.reduce((total, a) => total + a.value, 0);

        await FinancialPlanningRepository.update(uid, validatedData.planningId, {
            categoryAllocations: updatedAllocations,
            allocatedAmount: updatedAllocatedAmount,
            updatedAt: new Date()
        });

        const updatedPlanning = await FinancialPlanningRepository.getById(uid, validatedData.planningId);
        if (!updatedPlanning) {
            throw new Error(this.ERROR_MESSAGES.PLANNING_NOT_FOUND);
        }

        return await this.enrichFinancialPlanningWithCategories(uid, updatedPlanning);
    }

    private static async enrichFinancialPlanningWithCategories(
        uid: string,
        planning: FinancialPlanning
    ): Promise<FinancialPlanningWithCategories> {
        const categoryIds = planning.categoryAllocations.map(a => a.categoryId);
        const categories = await CategoryRepository.getByIds(uid, categoryIds);

        const categoryAllocations = planning.categoryAllocations.map(allocation => {
            const category = categories.find(c => c.id === allocation.categoryId);
            return {
                category: category!,
                value: allocation.value
            };
        });

        return {
            ...planning,
            categoryAllocations,
            unallocatedAmount: planning.budgetAmount - planning.allocatedAmount
        };
    }

    private static async enrichFinancialPlanningWithSpending(
        uid: string,
        planning: FinancialPlanning
    ): Promise<FinancialPlanningWithCategories> {
        let planningDate: Date;

        if (planning.month instanceof Date) {
            planningDate = planning.month;
        } else if (planning.month && typeof planning.month === 'object' && '_seconds' in planning.month) {
            const timestamp = planning.month as FirestoreTimestamp;
            planningDate = new Date(timestamp._seconds * 1000);
        } else if (typeof planning.month === 'string') {
            planningDate = new Date(planning.month);
        } else {
            planningDate = new Date();
        }

        const year = planningDate.getFullYear();
        const month = planningDate.getMonth() + 1; // Convert from 0-indexed to 1-indexed

        const startDate = dayjs()
            .tz(this.TIMEZONE)
            .year(year)
            .month(month - 1)
            .date(1)
            .hour(0)
            .minute(0)
            .second(0)
            .millisecond(0)
            .toDate();

        const endDate = dayjs()
            .tz(this.TIMEZONE)
            .year(year)
            .month(month)
            .date(0)
            .hour(23)
            .minute(59)
            .second(59)
            .millisecond(999)
            .toDate();

        const transactions = await TransactionRepository.getByDateRange(uid, startDate, endDate);

        const categoryIds = planning.categoryAllocations.map(a => a.categoryId);
        const categories = await CategoryRepository.getByIds(uid, categoryIds);

        let totalSpent = 0;
        let totalPaidSpent = 0;
        let totalUnpaidSpent = 0;

        const categoryAllocations = planning.categoryAllocations.map(allocation => {
            const category = categories.find(c => c.id === allocation.categoryId)!;

            const categoryTransactions = transactions.filter(t => {
                if (t.category === allocation.categoryId) {
                    return t.type === 'EXPENSE';
                }

                if (typeof t.category === 'string' && category.icon === t.category) {
                    return t.type === 'EXPENSE';
                }

                return false;
            });

            const paidTransactions = categoryTransactions.filter(t => t.isPaid);
            const unpaidTransactions = categoryTransactions.filter(t => !t.isPaid);

            const paidSpent = paidTransactions.reduce((total, t) => total + t.value, 0);
            const unpaidSpent = unpaidTransactions.reduce((total, t) => total + t.value, 0);
            const spent = paidSpent + unpaidSpent;

            totalPaidSpent += paidSpent;
            totalUnpaidSpent += unpaidSpent;
            totalSpent += spent;

            const remaining = allocation.value - spent;
            const percentUsed = allocation.value > 0 ?
                Math.round((spent / allocation.value) * 10000) / 100 : 0;

            const percentPaidUsed = allocation.value > 0 ?
                Math.round((paidSpent / allocation.value) * 10000) / 100 : 0;

            const percentUnpaidUsed = allocation.value > 0 ?
                Math.round((unpaidSpent / allocation.value) * 10000) / 100 : 0;


            return {
                category,
                value: allocation.value,
                spent,
                paidSpent,
                unpaidSpent,
                remaining,
                percentUsed,
                percentPaidUsed,
                percentUnpaidUsed
            };
        });

        const percentUsed = planning.budgetAmount > 0 ?
            Math.round((totalSpent / planning.budgetAmount) * 10000) / 100 : 0;

        const percentPaidUsed = planning.budgetAmount > 0 ?
            Math.round((totalPaidSpent / planning.budgetAmount) * 10000) / 100 : 0;

        const percentUnpaidUsed = planning.budgetAmount > 0 ?
            Math.round((totalUnpaidSpent / planning.budgetAmount) * 10000) / 100 : 0;

        return {
            ...planning,
            categoryAllocations,
            totalSpent,
            totalPaidSpent,
            totalUnpaidSpent,
            remainingBudget: planning.budgetAmount - totalSpent,
            percentUsed,
            percentPaidUsed,
            percentUnpaidUsed,
            unallocatedAmount: planning.budgetAmount - planning.allocatedAmount
        };
    }
}
