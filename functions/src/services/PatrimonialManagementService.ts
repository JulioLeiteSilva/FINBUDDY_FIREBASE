import { db } from "../config/firebase";
import {
  AssetItemSchema,
  CreateAssetItemDTO,
  CreateTangibleGoodsItemDTO,
  TangibleGoodsItemSchema,
  UpdateAssetItemDTO,
  UpdateTangibleGoodsItemDTO,
} from "../dto/PatrimonialManagementDTO";
import {
  AssetItem,
  PatrimonialItem,
  TangibleGoodsItem,
} from "../models/PatrimonialManagement";
import { PatrimonialManagementRepository } from "../repositories/PatrimonialManagementRepository";

export class PatrimonialManagementService {
  private static readonly ERROR_MESSAGES = {
    ASSET_NOT_FOUND: "Investimento não encontrado.",
    CHANGE_ASSET_TYPE_NOT_ALLOWED: "Não é permitido alterar o tipo do ativo.",
    TANGIBLE_GOODS_NOT_FOUND: "Bem material não encontrado.",
    CHANGE_TANGIBLE_GOODS_TYPE_NOT_ALLOWED:
      "Não é permitido alterar o tipo do bem material.",
    PATRIMONIAL_ITEM_NOT_FOUND: "Item patrimonial não encontrado.",
  };

  static async createAsset(uid: string, data: CreateAssetItemDTO) {
    const validatedData = AssetItemSchema.parse(data);

    const id = db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc().id;

    const now = new Date();
    const itemToSave = {
      ...validatedData,
      id,
      onCreate: validatedData.onCreate ? new Date(validatedData.onCreate) : now,
    };

    await PatrimonialManagementRepository.create(uid, itemToSave);
    const value = itemToSave.quantity * itemToSave.avgCost;

    return {
      ...itemToSave,
      value: value,
    };
  }

  static async createTangibleGoods(
    uid: string,
    data: CreateTangibleGoodsItemDTO
  ) {
    const validatedData = TangibleGoodsItemSchema.parse(data);

    const id = db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc().id;

    const now = new Date();
    const itemToSave = {
      ...validatedData,
      id,
      onCreate: validatedData.onCreate ? new Date(validatedData.onCreate) : now,
    };

    await PatrimonialManagementRepository.create(uid, itemToSave);

    return itemToSave;
  }

  static async updateAsset(uid: string, data: UpdateAssetItemDTO) {
    const existing = await PatrimonialManagementRepository.get(uid, data.id);
    if (
      !existing ||
      existing.category !== "Asset" ||
      !("AssetType" in existing)
    ) {
      throw new Error(this.ERROR_MESSAGES.ASSET_NOT_FOUND);
    }

    if (data.AssetType !== existing.AssetType) {
      throw new Error(this.ERROR_MESSAGES.CHANGE_ASSET_TYPE_NOT_ALLOWED);
    }

    const uptadatedData: Partial<AssetItem> = {
      id: data.id,
      name: data.name,
      onCreate: new Date(data.onCreate),
      category: data.category,
      AssetType: data.AssetType,
      quantity: data.quantity,
      avgCost: data.avgCost,
    };

    await PatrimonialManagementRepository.update(uid, uptadatedData);

    const updated = await PatrimonialManagementRepository.get(uid, data.id);
    return updated as AssetItem;
  }

  static async updateTangibleGoods(
    uid: string,
    data: UpdateTangibleGoodsItemDTO
  ) {
    const existing = await PatrimonialManagementRepository.get(uid, data.id);
    if (!existing || existing.category !== "Asset" || !("type" in existing)) {
      throw new Error(this.ERROR_MESSAGES.TANGIBLE_GOODS_NOT_FOUND);
    }

    if (data.type !== existing.type) {
      throw new Error(
        this.ERROR_MESSAGES.CHANGE_TANGIBLE_GOODS_TYPE_NOT_ALLOWED
      );
    }

    const updatedData: Partial<TangibleGoodsItem> = {
      id: data.id,
      name: data.name,
      onCreate: new Date(data.onCreate),
      category: data.category,
      type: data.type,
      description: data.description,
      obersationValue: data.obersationValue,
      initialValue: data.initialValue,
    };

    await PatrimonialManagementRepository.update(uid, updatedData);

    const updated = await PatrimonialManagementRepository.get(uid, data.id);
    return updated as TangibleGoodsItem;
  }

  static async delete(uid: string, id: string): Promise<void> {
    const existing = await PatrimonialManagementRepository.get(uid, id);

    if (!existing) {
      throw new Error(this.ERROR_MESSAGES.PATRIMONIAL_ITEM_NOT_FOUND);
    }

    await PatrimonialManagementRepository.delete(uid, id);
  }

  static async getAllAssets(
    uid: string
  ): Promise<(AssetItem | TangibleGoodsItem)[]> {
    const items = await PatrimonialManagementRepository.getAll(uid);

    const assets = items.filter((item) => item.category === "Asset");

    return assets.map((item) => {
      if ("AssetType" in item) {
        const asset = item as AssetItem;
        return {
          ...asset,
          value: asset.quantity * asset.avgCost,
        };
      }
      return item as TangibleGoodsItem;
    });
  }
}
