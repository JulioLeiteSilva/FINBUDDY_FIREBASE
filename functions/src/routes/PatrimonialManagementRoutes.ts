import { CreateAssetItemDTO, CreateTangibleGoodsItemDTO, DeletePatrimonialItemDTO, UpdateAssetItemDTO, UpdateTangibleGoodsItemDTO } from "../dto/PatrimonialManagementDTO";
import { AssetItem, TangibleGoodsItem } from "../models/PatrimonialManagement";
import { PatrimonialManagementService } from "../services/PatrimonialManagementService";
import { createAuthenticatedRoute } from "../utils/routeWrapper";

export const patrimonialManagementRoutes = {
  create: createAuthenticatedRoute<CreateAssetItemDTO | CreateTangibleGoodsItemDTO, AssetItem | TangibleGoodsItem>(
    async (request) => {
      if ("AssetType" in request.data) {
        return await PatrimonialManagementService.createAsset(request.uid, request.data as CreateAssetItemDTO);
      }
      if ("type" in request.data) {
        return await PatrimonialManagementService.createTangibleGoods(request.uid, request.data as CreateTangibleGoodsItemDTO);
      }
      throw new Error("Tipo de item patrimonial não reconhecido.");
    },
    {
      successMessage: "Item patrimonial criado com sucesso",
      requireData: true,
    }
  ),

  update: createAuthenticatedRoute<UpdateAssetItemDTO | UpdateTangibleGoodsItemDTO, AssetItem | TangibleGoodsItem>(
    async (request) => {
      if ("AssetType" in request.data) {
        return await PatrimonialManagementService.updateAsset(request.uid, request.data as UpdateAssetItemDTO);
      }
      if ("type" in request.data) {
        return await PatrimonialManagementService.updateTangibleGoods(request.uid, request.data as UpdateTangibleGoodsItemDTO);
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

  getAllAssets: createAuthenticatedRoute<void, (AssetItem | TangibleGoodsItem)[]>(
    async (request) => {
      return await PatrimonialManagementService.getAllAssets(request.uid);
    },
    {
      successMessage: "Itens patrimoniais recuperados com sucesso",
      requireData: false,
    }
  ),
};