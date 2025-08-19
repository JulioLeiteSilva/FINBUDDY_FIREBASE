import { CategoryService } from "../services/CategoryService";
import { CategoryRequestDTO } from "../dto/CategoryRequestDTO";
import { AuthenticatedRequest } from "../utils/routeWrapper";

export class CategoryController {
  static async createCategory(request: AuthenticatedRequest<CategoryRequestDTO>) {
    return await CategoryService.createCategory(request.uid, request.data);
  }

  static async updateCategory(
    request: AuthenticatedRequest<CategoryRequestDTO & { id: string }>
  ) {
    const { id, ...updateData } = request.data;
    return await CategoryService.updateCategory(request.uid, id, updateData);
  }

  static async deleteCategory(request: AuthenticatedRequest<{ id: string }>) {
    return await CategoryService.deleteCategory(request.uid, request.data.id);
  }
  static async getAllCategories(request: AuthenticatedRequest<void>) {
    return await CategoryService.getAllCategories(request.uid);
  }

  static async getCategory(request: AuthenticatedRequest<{ id: string }>) {
    return await CategoryService.getCategory(request.uid, request.data.id);
  }
}

