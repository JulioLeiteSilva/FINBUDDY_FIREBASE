import { db } from "../config/firebase";
import { defaultCategories } from "../data/defaultCategories";
import { Category } from "../models/Category";

export class GlobalCategoryService {
  static async seedDefaultCategories(): Promise<void> {
    const batch = db.batch();

    defaultCategories.forEach((category) => {
      const ref = db.collection("categoriesDefaults").doc();
      batch.set(ref, {
        id: ref.id,
        ...category,
      });
    });

    await batch.commit();
  }

  static async getAllDefaultCategories(): Promise<Category[]> {
    const snapshot = await db.collection("categoriesDefaults").get();
    return snapshot.docs.map((doc) => doc.data() as Category);
  }
}