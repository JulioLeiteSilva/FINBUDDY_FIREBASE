import { db } from "../config/firebase";

export class GlobalCategoryController {
  static async seedDefaults(): Promise<void> {
    const defaultCategories = [
      { name: "Alimentação", type: "EXPENSE", icon: "LocalDining" },
      { name: "Saúde", type: "EXPENSE", icon: "MedicalServices" },
      { name: "Transporte", type: "EXPENSE", icon: "DirectionsCar" },
      { name: "Lazer", type: "EXPENSE", icon: "SportsEsports" },
      { name: "Salário", type: "INCOME", icon: "AttachMoney" },
      { name: "Freelance", type: "INCOME", icon: "Work" },
      { name: "Investimentos", type: "INCOME", icon: "TrendingUp" },
    ];

    const batch = db.batch();

    defaultCategories.forEach((category) => {
      const ref = db.collection("categoriesDefaults").doc();
      batch.set(ref, category);
    });

    await batch.commit();
  }
}
