import { createAuthenticatedRoute } from "../utils/routeWrapper";
import { UserService } from "../services/UserService";
import { CompleteUserProfileDTO } from "../dto/CompleteUserProfileDTO";
import { UserPreRegisterDTO } from "../dto/UserPreRegisterDTO";
import { UserStatus } from "../enums/UserStatus";

export const userRoutes = {
  preRegisterUser: createAuthenticatedRoute<{ name: string }, any>(
    async (request) => {
      if (!request.auth?.token?.email) {
        throw new Error("Email não encontrado no token de autenticação");
      }
      const userData: UserPreRegisterDTO = {
        name: request.data.name,
        email: request.auth.token.email,
        status: UserStatus.PENDING,
        createdAt: new Date(),
      };

      const result = await UserService.createPreRegisteredUser(request.uid, userData);

      if (!result) {
        throw new Error("Usuário já existe");
      }
      return result;
    },
    {
      successMessage: "Usuário criado com sucesso",
      requireData: true,
    }
  ),

  completeUserProfile: createAuthenticatedRoute<CompleteUserProfileDTO, any>(
    async (request) => {
      const result = await UserService.completeUserProfile(request.uid, request.data);

      if (!result) {
        throw new Error("Usuário não encontrado");
      }

      return result;
    },
    {
      successMessage: "Cadastro completo com sucesso",
      requireData: true,
    }
  ),

  deactivateUser: createAuthenticatedRoute<void, any>(
    async (request) => {
      const result = await UserService.deactivateUser(request.uid);

      if (!result) {
        throw new Error("Usuário não encontrado");
      }

      return result;
    },
    {
      successMessage: "Usuário desativado com sucesso",
    }
  ),

  getUser: createAuthenticatedRoute<void, any>(
    async (request) => {
      const user = await UserService.getUserById(request.uid);

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      return user;
    }
  ),
};

