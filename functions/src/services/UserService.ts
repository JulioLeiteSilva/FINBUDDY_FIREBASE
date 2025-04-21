import { UserStatus } from "../enums/UserStatus";
import { UserRepository } from "../repositories/UserRepository";
import { CompleteUserProfileDTO } from "../dto/CompleteUserProfileDTO";
import { UserPreRegisterDTO } from "../dto/UserPreRegisterDTO";

export class UserService {
  static async createPreRegisteredUser(uid: string, data: UserPreRegisterDTO) {
    const alreadyExists = await UserRepository.exists(uid);
    if (alreadyExists) return null;

    const userWithId = { ...data, id: uid };
    return UserRepository.createPreUser(uid, userWithId);
  }

  static async completeUserProfile(uid: string, data: CompleteUserProfileDTO) {
    const existing = await UserRepository.getById(uid);
    if (!existing) return null;

    if (existing.status === UserStatus.COMPLETED) {
      throw new Error("Cadastro já foi finalizado");
    }

    return await UserRepository.updateUserProfile(uid, {
      ...data,
      status: UserStatus.COMPLETED,
    });
  }

  static async getUserById(uid: string) {
    return await UserRepository.getById(uid);
  }

  static async deactivateUser(uid: string) {
    return await UserRepository.deactivateById(uid, {
      status: UserStatus.DISABLED,
      deactivatedAt: new Date(),
    });
  }
}
