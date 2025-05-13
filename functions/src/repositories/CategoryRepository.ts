import { db } from "../config/firebase";
import { CategoryRequestDTO } from "../dto/CategoryRequestDTO";
import { Category } from "../models/Category";

export class CategoryRepository {
  static async create(uid: string, data: Category): Promise<void> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .doc(data.id);

    await ref.set(data);
  }

  static async update(
    uid: string,
    categoryId: string,
    data: Partial<CategoryRequestDTO>
  ): Promise<void> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .doc(categoryId);

    const doc = await ref.get();
    if (!doc.exists) {
      throw new Error("Categoria não encontrada");
    }

    await ref.update(data as { [key: string]: any });
  }

  static async delete(uid: string, categoryId: string): Promise<void> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .doc(categoryId);

    await ref.delete();
  }

  static async getAll(uid: string): Promise<Category[]> {
    const snapshot = await db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .get();

    return snapshot.docs.map((doc) => doc.data() as Category);
  }

  static async get(uid: string, categoryId: string): Promise<Category | null> {
    const ref = db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .doc(categoryId);

    const doc = await ref.get();
    return doc.exists ? (doc.data() as Category) : null;
  }
}
