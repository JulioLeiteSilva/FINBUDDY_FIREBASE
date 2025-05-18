import { GlobalCategoryService } from "../services/GlobalCategoryService";

export class GlobalCategoryController {
  static async seedDefaults(): Promise<void> {
    return await GlobalCategoryService.seedDefaultCategories();
  }

  static async getAllDefaults(): Promise<any[]> {
    return await GlobalCategoryService.getAllDefaultCategories();
  }
}
