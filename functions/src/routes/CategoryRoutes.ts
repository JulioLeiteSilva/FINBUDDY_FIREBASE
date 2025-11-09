import { createAuthenticatedRoute } from "../utils/routeWrapper";
import { CategoryController } from "../controllers/CategoryController";
import { CategoryRequestDTO } from "../dto/CategoryRequestDTO";
import { Category } from "../models/Category";

export const categoryRoutes = {
  createCategory: createAuthenticatedRoute<CategoryRequestDTO, Category>(
    CategoryController.createCategory,
    {
      successMessage: "Categoria criada com sucesso",
      requireData: true,
    }
  ),

  updateCategory: createAuthenticatedRoute<CategoryRequestDTO & { id: string }, Category>(
    CategoryController.updateCategory,
    {
      successMessage: "Categoria atualizada com sucesso",
      requireData: true,
    }
  ),

  deleteCategory: createAuthenticatedRoute<{ id: string }, void>(
    CategoryController.deleteCategory,
    {
      successMessage: "Categoria excluída com sucesso",
      requireData: true,
    }
  ),

  getCategory: createAuthenticatedRoute<{ id: string }, Category>(
    CategoryController.getCategory,
    {
      requireData: true,
    }
  ),

  getAllCategories: createAuthenticatedRoute<void, Category[]>(
    CategoryController.getAllCategories,
    {
      successMessage: "Categorias recuperadas com sucesso",
    }
  ),
};

