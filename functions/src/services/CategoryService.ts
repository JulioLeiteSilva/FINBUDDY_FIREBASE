import { db } from "../config/firebase";
import { CategoryRequestDTO } from "../dto/CategoryRequestDTO";
import { Category } from "../models/Category";
import { CategoryRepository } from "../repositories/CategoryRepository";

export class CategoryService {
  static async createCategory(
    uid: string,
    data: CategoryRequestDTO
  ): Promise<void> {
    const id = db
      .collection("users")
      .doc(uid)
      .collection("categories")
      .doc().id;

    const category: Category = {
      id,
      name: this.capitalizeWords(data.name),
      type: data.type,
      icon: data.icon,
    };

    await CategoryRepository.create(uid, category);
  }

  static async updateCategory(
    uid: string,
    categoryId: string,
    data: Partial<CategoryRequestDTO>
  ): Promise<void> {
    const updateData = {
      ...data,
      name: data.name ? this.capitalizeWords(data.name) : undefined,
    };

    await CategoryRepository.update(uid, categoryId, updateData);
  }
  static async deleteCategory(uid: string, categoryId: string): Promise<void> {
    await CategoryRepository.delete(uid, categoryId);
  }

  static async getAllCategories(uid: string): Promise<Category[]> {
    return await CategoryRepository.getAll(uid);
  }

  static async getCategory(
    uid: string,
    categoryId: string
  ): Promise<Category | null> {
    return await CategoryRepository.get(uid, categoryId);
  }

  private static capitalizeWords(text: string): string {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
}
