import { createAuthenticatedRoute } from "../utils/routeWrapper";
import { SimulationController } from "../controllers/SimulationController";

export const simulationRoutes = {
  getSimulationData: createAuthenticatedRoute<void, any>(
    SimulationController.getSimulationData,
    {
      successMessage: "Dados da simulação recuperados com sucesso",
    }
  ),
};
