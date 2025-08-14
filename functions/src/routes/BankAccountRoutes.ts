import { createAuthenticatedRoute } from "../utils/routeWrapper";
import { BankAccountService } from "../services/BankAccountService";
import { CreateBankAccountDTO, UpdateBankAccountDTO } from "../dto/BankAccountDTO";
export const bankAccountRoutes = {
  createBankAccount: createAuthenticatedRoute<CreateBankAccountDTO, any>(
    async (request) => {
      return await BankAccountService.create(request.uid, request.data);
    },
    {
      successMessage: "Conta bancária criada com sucesso",
      requireData: true,
    }
  ),

  updateBankAccount: createAuthenticatedRoute<UpdateBankAccountDTO & { id: string }, any>(
    async (request) => {
      const { id, ...updateData } = request.data;
      return await BankAccountService.update(request.uid, id, updateData);
    },
    {
      successMessage: "Conta bancária atualizada com sucesso",
      requireData: true,
    }
  ),

  updateBankAccountBalance: createAuthenticatedRoute<{ id: string; balance: number }, any>(
    async (request) => {
      return await BankAccountService.updateBalance(
        request.uid,
        request.data.id,
        request.data.balance
      );
    },
    {
      successMessage: "Saldo atualizado com sucesso",
      requireData: true,
    }
  ),

  deleteBankAccount: createAuthenticatedRoute<{ id: string }, void>(
    async (request) => {
      await BankAccountService.delete(request.uid, request.data.id);
    },
    {
      successMessage: "Conta bancária excluída com sucesso",
      requireData: true,
    }
  ),

  getBankAccount: createAuthenticatedRoute<{ id: string }, any>(
    async (request) => {
      return await BankAccountService.get(request.uid, request.data.id);
    },
    {
      requireData: true,
    }
  ),

  getAllBankAccounts: createAuthenticatedRoute<void, any>(
    async (request) => {
      const accounts = await BankAccountService.getAll(request.uid);
      return { accounts };
    },
    {
      successMessage: "Listagem de contas efetuada com sucesso!",
    }
  ),
};
