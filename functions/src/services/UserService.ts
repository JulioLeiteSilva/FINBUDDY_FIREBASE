import { UserStatus } from "../enums/UserStatus";
import { UserRepository } from "../repositories/UserRepository";
import { CompleteUserProfileDTO, CompleteUserProfileSchema } from "../dto/CompleteUserProfileDTO";
import { UserPreRegisterDTO, UserPreRegisterSchema } from "../dto/UserPreRegisterDTO";

export class UserService {
  private static readonly ERROR_MESSAGES = {
    USER_EXISTS: "Usuário já existe",
    USER_NOT_FOUND: "Usuário não encontrado",
    PROFILE_COMPLETED: "Cadastro já foi finalizado",
  };

  static async createPreRegisteredUser(uid: string, data: UserPreRegisterDTO) {
    const validatedData = UserPreRegisterSchema.parse(data);
    const alreadyExists = await UserRepository.exists(uid);
    if (alreadyExists) {
      throw new Error(this.ERROR_MESSAGES.USER_EXISTS);
    }

    const userWithId = { ...validatedData, id: uid };
    return await UserRepository.createPreUser(uid, userWithId);
  }

  static async completeUserProfile(uid: string, data: CompleteUserProfileDTO) {
    const validatedData = CompleteUserProfileSchema.parse(data);
    const existing = await UserRepository.getById(uid);
    if (!existing) {
      throw new Error(this.ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (existing.status === UserStatus.COMPLETED) {
      throw new Error(this.ERROR_MESSAGES.PROFILE_COMPLETED);
    }

    return await UserRepository.updateUserProfile(uid, {
      ...validatedData,
      status: UserStatus.COMPLETED,
    });
  }

  static async getUserById(uid: string) {
    const user = await UserRepository.getById(uid);
    if (!user) {
      throw new Error(this.ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user;
  }

  static async deactivateUser(uid: string) {
    const user = await UserRepository.getById(uid);
    if (!user) {
      throw new Error(this.ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return await UserRepository.deactivateById(uid, {
      status: UserStatus.DISABLED,
      deactivatedAt: new Date(),
    });
  }
}
