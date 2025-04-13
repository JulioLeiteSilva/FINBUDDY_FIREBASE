import { User } from "../models/User";
import { UserStatus } from "../models/UserStatus";
import { UserRepository } from "../repositories/UserRepository";

export class UserService {
  static async create(uid: string, name: string, email: string) {
    const alreadyExists = await UserRepository.exists(uid);
    if (alreadyExists) return null;

    const newUser: User = {
      name,
      email,
      status: UserStatus.PENDING,
      createdAt: new Date(),
    };

    return UserRepository.create(uid, newUser);
  }
}
