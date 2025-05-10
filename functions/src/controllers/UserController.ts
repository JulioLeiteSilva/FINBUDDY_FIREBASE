import {
  CompleteUserProfileDTO,
  CompleteUserProfileSchema,
} from "../dto/CompleteUserProfileDTO";
import {
  UserPreRegisterDTO,
  UserPreRegisterSchema,
} from "../dto/UserPreRegisterDTO";
import { UserService } from "../services/UserService";
import { z } from "zod";

export class UserController {
  static async preRegisterUser(data: UserPreRegisterDTO, uid: string) {
    try {
      // Validate incoming data against schema
      const validatedData = UserPreRegisterSchema.parse(data);

      const result = await UserService.createPreRegisteredUser(
        uid,
        validatedData
      );
      if (!result) throw new Error("Usuário já existe");

      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod validation errors
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
      }
      throw error;
    }
  }

  static async completeUserProfile(uid: string, data: CompleteUserProfileDTO) {
    try {
      // Validate incoming data against schema
      const validatedData = CompleteUserProfileSchema.parse(data);

      return await UserService.completeUserProfile(uid, validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
      }
      throw error;
    }
  }

  static async getUser(uid: string) {
    return await UserService.getUserById(uid);
  }

  static async deactivateUser(uid: string) {
    return await UserService.deactivateUser(uid);
  }
}
