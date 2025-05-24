import {
  CategoryRequestDTO,
  CategoryRequestSchema,
} from "../dto/CategoryRequestDTO";
import { CategoryService } from "../services/CategoryService";
import { z } from "zod";

export class CategoryController {
  static async createCategory(
    uid: string,
    data: CategoryRequestDTO
  ): Promise<void> {
    try {
      const validatedData = CategoryRequestSchema.parse(data);
      await CategoryService.createCategory(uid, validatedData);
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

  static async updateCategory(
    uid: string,
    categoryId: string,
    data: Partial<CategoryRequestDTO>
  ): Promise<void> {
    if (!categoryId) {
      throw new Error("ID da categoria é obrigatório");
    }
    try {
      const validatedData = CategoryRequestSchema.partial().parse(data);
      await CategoryService.updateCategory(uid, categoryId, validatedData);
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

  static async deleteCategory(uid: string, categoryId: string): Promise<void> {
    if (!categoryId) {
      throw new Error("ID da categoria é obrigatório");
    }

    await CategoryService.deleteCategory(uid, categoryId);
  }

  static async getAllCategories(uid: string) {
    return await CategoryService.getAllCategories(uid);
  }

  static async getCategory(uid: string, categoryId: string) {
    if (!categoryId) {
      throw new Error("ID da categoria é obrigatório");
    }

    return await CategoryService.getCategory(uid, categoryId);
  }
}
