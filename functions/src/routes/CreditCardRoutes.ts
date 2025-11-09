import { createAuthenticatedRoute } from "../utils/routeWrapper";
import { CreditCardController } from "../controllers/CreditCardController";
import { CreditCardRequestDTO } from "../dto/CreditCardRequestDTO";

export const creditCardRoutes = {
  create: createAuthenticatedRoute<CreditCardRequestDTO, any>(
    CreditCardController.create,
    {
      successMessage: "Cartão criado com sucesso",
      requireData: true,
    }
  ),

  update: createAuthenticatedRoute<CreditCardRequestDTO & { id: string }, void>(
    CreditCardController.update,
    {
      successMessage: "Cartão atualizado com sucesso",
      requireData: true,
    }
  ),

  delete: createAuthenticatedRoute<{ id: string }, void>(
    CreditCardController.delete,
    {
      successMessage: "Cartão excluído com sucesso",
      requireData: true,
    }
  ),

  getAll: createAuthenticatedRoute<void, any>(
    CreditCardController.getAll,
    {
      successMessage: "Cartões recuperados com sucesso",
    }
  ),
};

