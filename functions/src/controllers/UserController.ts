import { UserService } from "../services/UserService";

export class UserController {
  static async preRegisterUser(name: string, uid: string, email: string) {
    if (!name) throw new Error("Nome é obrigatório");

    const result = await UserService.createPreRegisteredUser(uid, name, email);

    if (!result) throw new Error("Usuário já existe");

    return result;
  }
}
