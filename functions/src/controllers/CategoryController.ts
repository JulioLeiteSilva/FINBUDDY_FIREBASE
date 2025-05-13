import { CategoryRequestDTO } from "../dto/CategoryRequestDTO";
import { CategoryService } from "../services/CategoryService";

export class CategoryController {

  static async createCategory(uid: string, data: CategoryRequestDTO): Promise<void> {
    if (!data.name || !data.type || !data.icon) {
      throw new Error("Todos os campos (nome, tipo e ícone) são obrigatórios");
    }
    if (!["INCOME", "EXPENSE"].includes(data.type)) {
      throw new Error("O tipo da categoria deve ser 'INCOME' ou 'EXPENSE'");
    }

    await CategoryService.createCategory(uid, data);
  }


  static async updateCategory(
    uid: string,
    categoryId: string,
    data: Partial<CategoryRequestDTO>
  ): Promise<void> {
    if (!categoryId) {
      throw new Error("ID da categoria é obrigatório");
    }
    if (data.type && !["INCOME", "EXPENSE"].includes(data.type)) {
      throw new Error("O tipo da categoria deve ser 'INCOME' ou 'EXPENSE'");
    }

    await CategoryService.updateCategory(uid, categoryId, data);
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
