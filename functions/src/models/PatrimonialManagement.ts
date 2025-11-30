import { AssetType } from "../enums/AssetType";
import { TangibleGoodsType } from "../enums/TangibleGoodsType";

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  changes: AssetItem | TangibleGoodsItem | LiabilityItem;
}

export interface PatrimonialItem{
  id: string;
  name: string;
  onCreate: Date;
  category: "Asset" | "Liability";
  history?: HistoryEntry[];
}

export interface AssetItem extends PatrimonialItem{
  category: "Asset";
  AssetType: AssetType;
  quantity: number;
  avgCost: number;
}

export interface TangibleGoodsItem extends PatrimonialItem{
  category: "Asset";
  type: TangibleGoodsType;
  description?: string;
  obersationValue: number;
  initialValue: number;
}

export interface LiabilityItem extends PatrimonialItem{
  category: "Liability";
  totalDebtAmount: number;
  updatedDebtsAmount: number;
  term: number;
  installmentValue: number;
}