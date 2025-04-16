import { UserPreRegister } from "../models/UserPreRegister";
import { UserStatus } from "../models/UserStatus";
import { UserRepository } from "../repositories/UserRepository";

export class UserService {
  static async createPreRegisteredUser(
    uid: string,
    name: string,
    email: string
  ) {
    const alreadyExists = await UserRepository.exists(uid);
    if (alreadyExists) return null;

    const newUser: UserPreRegister = {
      id: uid,
      name,
      email,
      status: UserStatus.PENDING,
      createdAt: new Date(),
    };

    return UserRepository.createPreUser(uid, newUser);
  }
}
