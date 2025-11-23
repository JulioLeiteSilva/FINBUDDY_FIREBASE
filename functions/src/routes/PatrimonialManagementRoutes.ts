import {
  CreateAssetItemDTO,
  CreateLiabilityItemDTO,
  CreateTangibleGoodsItemDTO,
  DeletePatrimonialItemDTO,
  UpdateAssetItemDTO,
  UpdateLiabilityItemDTO,
  UpdateTangibleGoodsItemDTO,
} from "../dto/PatrimonialManagementDTO";
import {
  AssetItem,
  HistoryEntry,
  LiabilityItem,
  TangibleGoodsItem,
} from "../models/PatrimonialManagement";
import { PatrimonialManagementService } from "../services/PatrimonialManagementService";
import { createAuthenticatedRoute } from "../utils/routeWrapper";

export const patrimonialManagementRoutes = {
  create: createAuthenticatedRoute<
    CreateAssetItemDTO | CreateTangibleGoodsItemDTO | CreateLiabilityItemDTO,
    AssetItem | TangibleGoodsItem | LiabilityItem
  >(
    async (request) => {
      if (request.data && (request.data as any).category === "Liability") {
        return await PatrimonialManagementService.createLiability(
          request.uid,
          request.data as CreateLiabilityItemDTO
        );
      }
      if ("AssetType" in request.data) {
        return await PatrimonialManagementService.createAsset(
          request.uid,
          request.data as CreateAssetItemDTO
        );
      }
      if ("type" in request.data) {
        return await PatrimonialManagementService.createTangibleGoods(
          request.uid,
          request.data as CreateTangibleGoodsItemDTO
        );
      }
      throw new Error("Tipo de item patrimonial não reconhecido.");
    },
    {
      successMessage: "Item patrimonial criado com sucesso",
      requireData: true,
    }
  ),

  update: createAuthenticatedRoute<
    UpdateAssetItemDTO | UpdateTangibleGoodsItemDTO | UpdateLiabilityItemDTO,
    AssetItem | TangibleGoodsItem | LiabilityItem
  >(
    async (request) => {
      if (request.data && (request.data as any).category === "Liability") {
        return await PatrimonialManagementService.updateLiability(request.uid, request.data as UpdateLiabilityItemDTO);
      }
      if ("AssetType" in request.data) {
        return await PatrimonialManagementService.updateAsset(
          request.uid,
          request.data as UpdateAssetItemDTO
        );
      }
      if ("type" in request.data) {
        return await PatrimonialManagementService.updateTangibleGoods(
          request.uid,
          request.data as UpdateTangibleGoodsItemDTO
        );
      }
      throw new Error("Tipo de item patrimonial não reconhecido.");
    },
    {
      successMessage: "Item patrimonial atualizado com sucesso",
      requireData: true,
    }
  ),

  delete: createAuthenticatedRoute<DeletePatrimonialItemDTO, void>(
    async (request) => {
      await PatrimonialManagementService.delete(request.uid, request.data.id);
    },
    {
      successMessage: "Item patrimonial excluído com sucesso",
      requireData: true,
    }
  ),

  getAll: createAuthenticatedRoute<
    void,
    (AssetItem | TangibleGoodsItem | LiabilityItem)[]
  >(
    async (request) => {
      return await PatrimonialManagementService.getAll(request.uid);
    },
    {
      successMessage: "Itens patrimoniais recuperados com sucesso",
      requireData: false,
    }
  ),
  
  getHistory: createAuthenticatedRoute<DeletePatrimonialItemDTO, HistoryEntry[]>(
    async (request) => {
      return await PatrimonialManagementService.getPatrimonialItemHistory(request.uid, request.data.id);
    },
    {
      successMessage: "Histórico do item recuperado com sucesso",
      requireData: true,
    }
  ),
};
