export interface PatrimonialItem{
  id: string;
  name: string;
  onCreate: Date;
  category: "Asset" | "Liability";
}

export interface AssetItem extends PatrimonialItem{
  category: "Asset";
  AssetType: string; // Renda fix, acoes, fii, cripto
  quantity: number;
  avgCost: number;
}

export interface TangibleGoodsItem extends PatrimonialItem{
  category: "Asset";
  type: string; // Carro, moto, imovel
  description?: string;
  obersationValue: number;
  initialValue: number;
}

export interface LiabilityItem extends PatrimonialItem{
  category: "Liability";
  totalDebtAmount: number;
  updatedDebtsAmount: number;
  interestRate: number;
  term: number;
  installmentValue: number;
}