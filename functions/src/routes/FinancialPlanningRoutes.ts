import { createAuthenticatedRoute } from "../utils/routeWrapper";
import { FinancialPlanningService } from "../services/FinancialPlanningService";
import { 
  CreateFinancialPlanningRequestDTO,
  CopyFinancialPlanningRequestDTO,
  GetFinancialPlanningRequestDTO,
  UpdateFinancialPlanningRequestDTO,
  DeleteFinancialPlanningRequestDTO
} from "../dto/FinancialPlanningDTO";
import { FinancialPlanningWithCategories } from "../models/FinancialPlanning";

export const financialPlanningRoutes = {
  create: createAuthenticatedRoute<CreateFinancialPlanningRequestDTO, FinancialPlanningWithCategories>(
    async (request) => {
      return await FinancialPlanningService.create(request.uid, request.data);
    },
    {
      successMessage: "Planejamento financeiro criado com sucesso",
      requireData: true,
    }
  ),

  copyFromMonth: createAuthenticatedRoute<CopyFinancialPlanningRequestDTO, FinancialPlanningWithCategories>(
    async (request) => {
      return await FinancialPlanningService.copyFromMonth(request.uid, request.data);
    },
    {
      successMessage: "Planejamento financeiro copiado com sucesso",
      requireData: true,
    }
  ),

  getByMonth: createAuthenticatedRoute<GetFinancialPlanningRequestDTO, FinancialPlanningWithCategories>(
    async (request) => {
      return await FinancialPlanningService.getByMonth(request.uid, request.data);
    },
    {
      successMessage: "Planejamento financeiro recuperado com sucesso",
      requireData: true,
    }
  ),

  update: createAuthenticatedRoute<UpdateFinancialPlanningRequestDTO, FinancialPlanningWithCategories>(
    async (request) => {
      return await FinancialPlanningService.update(request.uid, request.data);
    },
    {
      successMessage: "Planejamento financeiro atualizado com sucesso",
      requireData: true,
    }
  ),

  delete: createAuthenticatedRoute<DeleteFinancialPlanningRequestDTO, void>(
    async (request) => {
      await FinancialPlanningService.delete(request.uid, request.data);
    },
    {
      successMessage: "Planejamento financeiro excluído com sucesso",
      requireData: true,
    }
  ),
};
