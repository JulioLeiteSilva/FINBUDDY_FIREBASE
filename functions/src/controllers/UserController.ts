import { CompleteUserProfileDTO } from "../dto/CompleteUserProfileDTO";
import { UserPreRegisterDTO } from "../dto/UserPreRegisterDTO";
import { UserService } from "../services/UserService";

export class UserController {
  static async preRegisterUser(data: UserPreRegisterDTO, uid: string) {
    if (!data.name) throw new Error("Nome é obrigatório");

    const result = await UserService.createPreRegisteredUser(uid, data);

    if (!result) throw new Error("Usuário já existe");

    return result;
  }

  static async completeUserProfile(uid: string, data: CompleteUserProfileDTO) {
    const { cellphone, address, birthDate, CPF, financialObjective } = data;

    if (!cellphone || !address || !birthDate || !CPF || !financialObjective) {
      throw new Error("Todos os campos são obrigatórios");
    }

    return await UserService.completeUserProfile(uid, data);
  }

  static async getUser(uid: string) {
    return await UserService.getUserById(uid);
  }
}
