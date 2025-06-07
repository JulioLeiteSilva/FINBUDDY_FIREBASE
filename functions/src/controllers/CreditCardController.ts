import { z } from "zod";
import { CreditCardRequestDTO, CreditCardRequestSchema } from "../dto/CreditCardRequestDTO";
import { CreditCardService } from "../services/CreditCardService";

export class CreditCardController {
  static async create(uid: string, data: CreditCardRequestDTO) {
    try {
      const validated = CreditCardRequestSchema.parse(data);

      
      await CreditCardService.create(uid, validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  }

  static async update(uid: string, cardId: string, data: CreditCardRequestDTO) {
    try {
      const validated = CreditCardRequestSchema.partial().parse(data);
      await CreditCardService.update(uid, cardId, validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  }

  static async delete(uid: string, cardId: string) {
    await CreditCardService.delete(uid, cardId);
  }

  static async getAll(uid: string) {
    return await CreditCardService.getAll(uid);
  }
}