import dayjs from "dayjs";
import { Transaction } from "../models/Transaction";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { PatrimonialManagementRepository } from "../repositories/PatrimonialManagementRepository";
import { PatrimonialItem } from "../models/PatrimonialManagement";
import { firestoreTimestampToDate } from "../utils/firestoreUtils";

// Helper for unique recurring transactions
function uniqueRecurring(transactions: Transaction[]) {
  const seen = new Set<string>();
  return transactions.filter((tx) => {
    if (!tx.isRecurring) return false;
    const key = `${tx.name}|${tx.category}|${tx.frequency}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class SimulationService {
  // Get fixed incomes (unique recurring INCOME transactions)
  static async getFixedIncomes(userId: string) {
    const transactions: Transaction[] = await TransactionRepository.getAll(
      userId
    );
    const unique = uniqueRecurring(
      transactions.filter((tx) => tx.type === "INCOME")
    );
    return unique.map((tx) => ({
      name: tx.name,
      value: tx.value,
      category: tx.category,
    }));
  }

  // Get average incomes by category for the last 3 months (non-recurring only)
  static async getAverageIncomesByCategory(userId: string) {
    const transactions: Transaction[] = await TransactionRepository.getAll(
      userId
    );
    const threeMonthsAgo = dayjs().subtract(3, "month").toDate();
    const recent = transactions.filter(
      (tx) =>
        tx.type === "INCOME" &&
        !tx.isRecurring &&
        firestoreTimestampToDate(tx.date) &&
        firestoreTimestampToDate(tx.date)! > threeMonthsAgo
    );
    console.log("Recent Incomes:", recent);
    const categoryMap: { [category: string]: number[] } = {};
    recent.forEach((tx) => {
      if (!categoryMap[tx.category]) categoryMap[tx.category] = [];
      categoryMap[tx.category].push(tx.value);
    });
    console.log("Category Map:", categoryMap);
    return Object.entries(categoryMap).map(([category, values]) => ({
      category,
      averageValue: values.length
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0,
    }));
  }

  // Get fixed expenses (unique recurring EXPENSE transactions)
  static async getFixedExpenses(userId: string) {
    const transactions: Transaction[] = await TransactionRepository.getAll(
      userId
    );
    const unique = uniqueRecurring(
      transactions.filter((tx) => tx.type === "EXPENSE")
    );
    return unique.map((tx) => ({
      name: tx.name,
      value: tx.value,
      category: tx.category,
    }));
  }

  // Get average expenses by category for the last 3 months (non-recurring only)
  static async getAverageExpensesByCategory(userId: string) {
    const transactions: Transaction[] = await TransactionRepository.getAll(
      userId
    );
    const threeMonthsAgo = dayjs().subtract(3, "month").toDate();
    const recent = transactions.filter(
      (tx) =>
        tx.type === "EXPENSE" &&
        !tx.isRecurring &&
        firestoreTimestampToDate(tx.date) &&
        firestoreTimestampToDate(tx.date)! > threeMonthsAgo
    );
    const categoryMap: { [category: string]: number[] } = {};
    recent.forEach((tx) => {
      if (!categoryMap[tx.category]) categoryMap[tx.category] = [];
      categoryMap[tx.category].push(tx.value);
    });
    return Object.entries(categoryMap).map(([category, values]) => ({
      category,
      averageValue: values.length
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0,
    }));
  }

  // Get all debts (LiabilityItem from PatrimonialItem)
  static async getDebts(userId: string) {
    const items = await PatrimonialManagementRepository.getAll(userId);
    return items
      .filter((item) => item.category === "Liability")
      .map((liability) => ({
        name: liability.name,
        value:
          (liability as any).updatedDebtsAmount ??
          (liability as any).totalDebtAmount ??
          0,
        category: "Liability",
      }));
  }

  static async getSimulationData(userId: string) {
    // Fetch all patrimonial items
    const assetsAndLiabilities: PatrimonialItem[] =
      await PatrimonialManagementRepository.getAll(userId);

    // Filter assets
    const assets = assetsAndLiabilities.filter(
      (item) => item.category === "Asset"
    );

    // Simplify assets
    const simplifiedAssets = assets.map((asset) => {
      let value = 0;
      // AssetItem: avgCost
      if ("avgCost" in asset && typeof (asset as any).avgCost === "number") {
        value = (asset as any).avgCost;
      }
      // TangibleGoodsItem: obersationValue
      else if (
        "obersationValue" in asset &&
        typeof (asset as any).obersationValue === "number"
      ) {
        value = (asset as any).obersationValue;
      }
      return {
        name: asset.name,
        value,
        category: asset.category,
      };
    });

    // Explicitly type all arrays
    const fixedIncomes: { name: string; value: number; category: string }[] =
      [];
    const averageIncomesByCategory: {
      category: string;
      averageValue: number;
    }[] = [];
    const debts: { name: string; value: number; category: string }[] = [];

    // Fetch fixed incomes and averages
    fixedIncomes.push(...(await SimulationService.getFixedIncomes(userId)));
    averageIncomesByCategory.push(
      ...(await SimulationService.getAverageIncomesByCategory(userId))
    );

    // Fetch debts from patrimonial items
    debts.push(...(await SimulationService.getDebts(userId)));
    const fixedExpenses = await SimulationService.getFixedExpenses(userId);
    const averageExpensesByCategory =
      await SimulationService.getAverageExpensesByCategory(userId);

    return {
      inputs: {
        assets: simplifiedAssets,
        fixedIncomes,
        averageIncomesByCategory,
      },
      outputs: {
        debts,
        fixedExpenses,
        averageExpensesByCategory,
      },
    };
  }
}
