import { CreditCardRequestDTO } from "../dto/CreditCardRequestDTO";
import { CreditCardService } from "../services/CreditCardService";
import { AuthenticatedRequest } from "../utils/routeWrapper";

export class CreditCardController {
  static async create(request: AuthenticatedRequest<CreditCardRequestDTO>) {
    return await CreditCardService.create(request.uid, request.data);
  }

  static async update(request: AuthenticatedRequest<CreditCardRequestDTO & { id: string }>) {
    const { id, ...updateData } = request.data;
    return await CreditCardService.update(request.uid, id, updateData);
  }

  static async delete(request: AuthenticatedRequest<{ id: string }>) {
    return await CreditCardService.delete(request.uid, request.data.id);
  }

  static async getAll(request: AuthenticatedRequest<void>) {
    return await CreditCardService.getAll(request.uid);
  }
}
