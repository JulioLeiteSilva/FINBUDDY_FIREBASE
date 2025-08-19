import { createAuthenticatedRoute } from "../utils/routeWrapper";
import { GlobalCategoryController } from "../controllers/GlobalCategoryController";

export const globalCategoryRoutes = {
  seedCategoriesDefaults: createAuthenticatedRoute<void, void>(
    async () => {
      await GlobalCategoryController.seedDefaults();
    },
    {
      successMessage: "Categorias padrão criadas com sucesso",
    }
  ),

  getAllDefaultCategories: createAuthenticatedRoute<void, any>(
    async () => {
      const categories = await GlobalCategoryController.getAllDefaults();
      return { categories };
    },
    {
      successMessage: "Categorias padrão recuperadas com sucesso",
    }
  ),
};

