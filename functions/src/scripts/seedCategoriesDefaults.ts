import { db } from "../config/firebase";


async function seedCategoriesDefaults() {
  const categories = [
    { name: "Alimentação", type: "EXPENSE", icon: "LocalDining" },
    { name: "Saúde", type: "EXPENSE", icon: "MedicalServices" },
    { name: "Transporte", type: "EXPENSE", icon: "DirectionsCar" },
    { name: "Salário", type: "INCOME", icon: "AttachMoney" },
    { name: "Freelance", type: "INCOME", icon: "Work" },
    { name: "Investimentos", type: "INCOME", icon: "TrendingUp" },
  ];

  for (const category of categories) {
    await db.collection("categoriesDefaults").add(category);
  }

  console.log("✅ Categorias default criadas com sucesso!");
}

seedCategoriesDefaults();