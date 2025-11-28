import { AuthenticatedRequest } from "../utils/routeWrapper";
import { SimulationService } from "../services/SimulationService";

export class SimulationController {
  static async getSimulationData(request: AuthenticatedRequest<void>) {
    const userId = request.uid;
    const simulationData = await SimulationService.getSimulationData(userId);
    return simulationData;
  }
}
