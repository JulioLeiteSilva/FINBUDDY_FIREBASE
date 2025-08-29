import { db } from "../config/firebase";
import { CategoryRequestDTO } from "../dto/CategoryRequestDTO";
import { Category } from "../models/Category";
import { GlobalCategoryService } from "../services/GlobalCategoryService";

export class CategoryRepository {
  private static async validateOwnership(uid: string, categoryId: string) {
    const doc = await db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .doc(categoryId)
      .get();

    if (!doc.exists) {
      throw new Error("Categoria não encontrada");
    }

    return doc;
  }
  static async create(uid: string, category: Category): Promise<Category> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .doc(category.id);

    await ref.set(category);
    return category;
  }

  static async update(
    uid: string,
    categoryId: string,
    data: Partial<CategoryRequestDTO>
  ): Promise<Category> {
    const doc = await this.validateOwnership(uid, categoryId);
    await doc.ref.update(data as { [key: string]: any });

    const updatedDoc = await doc.ref.get();
    const updatedData = updatedDoc.data();

    if (!updatedData) {
      throw new Error("Erro ao recuperar dados atualizados da categoria");
    }

    return updatedData as Category;
  }

  static async delete(uid: string, categoryId: string): Promise<void> {
    await this.validateOwnership(uid, categoryId);
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .doc(categoryId);

    await ref.delete();
  }

  static async get(uid: string, categoryId: string): Promise<Category | null> {
    const doc = await this.validateOwnership(uid, categoryId);
    const data = doc.data();
    return data ? (data as Category) : null;
  }

  static async getAll(uid: string): Promise<Category[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .get();

    return snapshot.docs.map((doc) => doc.data() as Category);
  }

  static async exists(uid: string, categoryId: string): Promise<boolean> {
    const doc = await db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .doc(categoryId)
      .get();

    return doc.exists;
  }

  static async getByIds(uid: string, categoryIds: string[]): Promise<Category[]> {
    if (categoryIds.length === 0) return [];

    const allUserCategories = await this.getAll(uid);
    const defaultCategories = await GlobalCategoryService.getAllDefaultCategories();

    const allCategories = [...allUserCategories, ...defaultCategories];
    const uniqueCategories = new Map();

    allCategories
      .filter(category => categoryIds.includes(category.id))
      .forEach(category => {
        if (!uniqueCategories.has(category.id)) {
          uniqueCategories.set(category.id, category);
        }
      });

    return allCategories.filter(category => categoryIds.includes(category.id));
  }
}
