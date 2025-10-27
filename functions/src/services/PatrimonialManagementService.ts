import z from "zod";
import { db } from "../config/firebase";
import {
  AssetItemSchema,
  CreateAssetItemDTO,
  CreateLiabilityItemDTO,
  CreateTangibleGoodsItemDTO,
  LiabilityItemSchema,
  TangibleGoodsItemSchema,
  UpdateAssetItemDTO,
  UpdateLiabilityItemDTO,
  UpdateLiabilityItemSchema,
  UpdateTangibleGoodsItemDTO,
} from "../dto/PatrimonialManagementDTO";
import { AssetType } from "../enums/AssetType";
import { TangibleGoodsType } from "../enums/TangibleGoodsType";
import {
  AssetItem,
  LiabilityItem,
  PatrimonialItem,
  TangibleGoodsItem,
} from "../models/PatrimonialManagement";
import { PatrimonialManagementRepository } from "../repositories/PatrimonialManagementRepository";
import { parseEnumOrThrow } from "../utils/enumTypeValidator";

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

    const assetType = parseEnumOrThrow(
      AssetType,
      validatedData.AssetType,
      "AssetType"
    );

    const id = db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc().id;

    const now = new Date();

    const itemToSave = {
      ...validatedData,
      id,
      AssetType: assetType,
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

    const tangibleGoodsType = parseEnumOrThrow(
      TangibleGoodsType,
      validatedData.type,
      "type"
    );

    const id = db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc().id;

    const now = new Date();
    const itemToSave = {
      ...validatedData,
      id,
      type: tangibleGoodsType,
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

    const existingAsset = existing as AssetItem;
    const incomingAssetType = parseEnumOrThrow(
      AssetType,
      data.AssetType,
      "AssetType"
    );

    if (incomingAssetType !== existing.AssetType) {
      throw new Error(this.ERROR_MESSAGES.CHANGE_ASSET_TYPE_NOT_ALLOWED);
    }

    const uptadatedData: Partial<AssetItem> = {
      id: data.id,
      name: data.name,
      onCreate: new Date(data.onCreate),
      category: data.category,
      AssetType: existingAsset.AssetType,
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
    const existingTangible = existing as TangibleGoodsItem;
    const incomingAssetType = parseEnumOrThrow(
      TangibleGoodsType,
      data.type,
      "type"
    );

    if (incomingAssetType !== existing.type) {
      throw new Error(
        this.ERROR_MESSAGES.CHANGE_TANGIBLE_GOODS_TYPE_NOT_ALLOWED
      );
    }

    const updatedData: Partial<TangibleGoodsItem> = {
      id: data.id,
      name: data.name,
      onCreate: new Date(data.onCreate),
      category: data.category,
      type: existingTangible.type,
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

  static async getAll(
    uid: string
  ): Promise<Array<(AssetItem & { value?: number }) | TangibleGoodsItem | LiabilityItem>> {
    const items = await PatrimonialManagementRepository.getAll(uid);

    const result: Array<(AssetItem & { value?: number }) | TangibleGoodsItem | LiabilityItem> = [];

    for (const item of items) {
      if (item.category === "Liability") {
        result.push(item as LiabilityItem);
        continue;
      }

      // Asset (investimentos, cripto, FIIs, etc)
      if (item.category === "Asset" && "AssetType" in item) {
        const asset = item as AssetItem;
        if (typeof asset.quantity === "number" && typeof asset.avgCost === "number") {
          result.push({ ...asset, value: asset.quantity * asset.avgCost });
        } else {
          result.push({ ...asset });
        }
        continue;
      }

      if (item.category === "Asset" && "type" in item) {
        result.push(item as TangibleGoodsItem);
        continue;
      }
    }

    return result;
  }

  static async createLiability(uid: string, data: CreateLiabilityItemDTO) {
    const validatedData = LiabilityItemSchema.parse(data);

    const id = db
      .collection("users")
      .doc(uid)
      .collection("patrimonialItems")
      .doc().id;

    const now = new Date();
    const itemToSave: LiabilityItem = {
      ...validatedData,
      id,
      onCreate: validatedData.onCreate ? new Date(validatedData.onCreate) : now,
    };

    await PatrimonialManagementRepository.create(uid, itemToSave);

    return itemToSave;
  }

  static async updateLiability(uid: string, data: UpdateLiabilityItemDTO) {
    const existing = await PatrimonialManagementRepository.get(uid, data.id);
    if (!existing || existing.category !== "Liability") {
      throw new Error(this.ERROR_MESSAGES.PATRIMONIAL_ITEM_NOT_FOUND);
    }

    const validated = UpdateLiabilityItemSchema
      ? UpdateLiabilityItemSchema.parse(data)
      : LiabilityItemSchema.extend({ id: z.string() }).parse(data);

    const updatedData: Partial<LiabilityItem> = {
      name: validated.name,
      onCreate: validated.onCreate ? new Date(validated.onCreate) : new Date(),
      category: validated.category,
      totalDebtAmount: validated.totalDebtAmount,
      updatedDebtsAmount: validated.updatedDebtsAmount,
      interestRate: validated.interestRate,
      term: validated.term,
      installmentValue: validated.installmentValue,
    };

    await PatrimonialManagementRepository.update(uid, updatedData);

    const updated = await PatrimonialManagementRepository.get(uid, data.id);
    return updated as LiabilityItem;
  }

  static async getAllLiabilities(uid: string): Promise<LiabilityItem[]> {
    const items = await PatrimonialManagementRepository.getAll(uid);
    const liabilities = items
      .filter((it) => it.category === "Liability")
      .map((it) => it as LiabilityItem);
    return liabilities;
  }
}
