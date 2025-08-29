import { db } from "../config/firebase";
import { CategoryRequestDTO, CategoryRequestSchema } from "../dto/CategoryRequestDTO";
import { Category } from "../models/Category";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { z } from "zod";

export class CategoryService {
  private static readonly ERROR_MESSAGES = {
    CATEGORY_NOT_FOUND: "Categoria não encontrada",
    CATEGORY_NAME_EXISTS: "Já existe uma categoria com este nome",
    VALIDATION_ERROR: "Dados inválidos",
  };

  static async createCategory(
    uid: string,
    data: CategoryRequestDTO
  ): Promise<Category> {
    const validatedData = this.validateCategoryData(data);
    await this.validateCategoryNameUnique(uid, validatedData.name);

    try {
      const id = db
        .collection("users")
        .doc(uid)
        .collection("categories")
        .doc().id;

      const category: Category = {
        id,
        name: this.capitalizeWords(validatedData.name),
        type: validatedData.type,
        icon: validatedData.icon,
      };

      return await CategoryRepository.create(uid, category);
    } catch (error) {
      throw new Error(`Erro ao criar categoria: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static async updateCategory(
    uid: string,
    categoryId: string,
    data: Partial<CategoryRequestDTO>
  ): Promise<Category> {
    const validatedData = this.validatePartialCategoryData(data);
    await this.validateCategoryExists(uid, categoryId);

    if (validatedData.name) {
      await this.validateCategoryNameUnique(uid, validatedData.name, categoryId);
    }

    const updateData = {
      ...validatedData,
      name: validatedData.name ? this.capitalizeWords(validatedData.name) : undefined,
    };

    return await CategoryRepository.update(uid, categoryId, updateData);
  }

  static async deleteCategory(uid: string, categoryId: string): Promise<void> {
    await this.validateCategoryExists(uid, categoryId);
    await CategoryRepository.delete(uid, categoryId);
  }

  static async getAllCategories(uid: string): Promise<Category[]> {
    return await CategoryRepository.getAll(uid);
  }

  static async getCategory(
    uid: string,
    categoryId: string
  ): Promise<Category> {
    const category = await CategoryRepository.get(uid, categoryId);

    if (!category) {
      throw new Error(this.ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return category;
  }

  private static validateCategoryData(data: CategoryRequestDTO): CategoryRequestDTO {
    try {
      return CategoryRequestSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new Error(`${this.ERROR_MESSAGES.VALIDATION_ERROR}: ${JSON.stringify(errors)}`);
      }
      throw error;
    }
  }

  private static validatePartialCategoryData(data: Partial<CategoryRequestDTO>): Partial<CategoryRequestDTO> {
    try {
      return CategoryRequestSchema.partial().parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new Error(`${this.ERROR_MESSAGES.VALIDATION_ERROR}: ${JSON.stringify(errors)}`);
      }
      throw error;
    }
  }

  private static async validateCategoryExists(
    uid: string,
    categoryId: string
  ): Promise<void> {
    const exists = await CategoryRepository.exists(uid, categoryId);

    if (!exists) {
      throw new Error(this.ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }
  }

  private static async validateCategoryNameUnique(
    uid: string,
    name: string,
    excludeCategoryId?: string
  ): Promise<void> {
    const categories = await CategoryRepository.getAll(uid);
    const normalizedName = this.capitalizeWords(name);

    const nameExists = categories.some(
      category =>
        category.name.toLowerCase() === normalizedName.toLowerCase() &&
        category.id !== excludeCategoryId
    );

    if (nameExists) {
      throw new Error(this.ERROR_MESSAGES.CATEGORY_NAME_EXISTS);
    }
  }

  private static capitalizeWords(text: string): string {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }


}
