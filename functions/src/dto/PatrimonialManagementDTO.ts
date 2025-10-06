import { z } from "zod";


export const PatrimonialItemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  onCreate: z.date().or(z.string()),
  category: z.enum(["Asset", "Liability"]),
});

export const AssetItemSchema = PatrimonialItemSchema.extend({
  category: z.literal("Asset"),
  AssetType: z.string().min(1, "Tipo do ativo é obrigatório"), 
  quantity: z.number().min(0, "Quantidade deve ser maior ou igual a zero"),
  avgCost: z.number().min(0, "Custo médio deve ser maior ou igual a zero"),
});

export const TangibleGoodsItemSchema = PatrimonialItemSchema.extend({
  category: z.literal("Asset"),
  type: z.string().min(1, "Tipo do bem é obrigatório"), // Ex: "Carro", "Imóvel"
  description: z.string().optional(),
  obersationValue: z.number().min(0, "Valor de observação deve ser maior oui gual a zero"),
  initialValue: z.number().min(0, "Valor inicial deve ser maior ou igual a zero"),
});

export const LiabilityItemSchema = PatrimonialItemSchema.extend({
  category: z.literal("Liability"),
  totalDebtAmount: z.number().min(0, "Valor total da dívida deve ser maior ou igual a zero"),
  updatedDebtsAmount: z.number().min(0, "Valor atualizado da dívida deve ser maior ou igual a zero"),
  interestRate: z.number().min(0, "Taxa de juros deve ser maior ou igual a zero"),
  term: z.number().min(1, "Prazo deve ser maior ou igual a 1"),
  installmentValue: z.number().min(0, "Valor da parcela deve ser maior ou igual a zero"),
});

export const CreateAssetItemSchema = z.union([
  AssetItemSchema,
  TangibleGoodsItemSchema,
]);

export const UpdateAssetItemSchema = AssetItemSchema.extend({
  id: z.string().min(1, "ID é obrigatório"),
});

export const UpdateTangibleGoodsItemSchema = TangibleGoodsItemSchema.extend({
  id: z.string().min(1, "ID é obrigatório"),
});

export const DeletePatrimonialItemSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});


export type CreateAssetItemDTO = z.infer<typeof AssetItemSchema>;
export type CreateTangibleGoodsItemDTO = z.infer<typeof TangibleGoodsItemSchema>;
export type CreateLiabilityItemDTO = z.infer<typeof LiabilityItemSchema>;
export type UpdateAssetItemDTO = z.infer<typeof UpdateAssetItemSchema>;
export type UpdateTangibleGoodsItemDTO = z.infer<typeof UpdateTangibleGoodsItemSchema>;
export type DeletePatrimonialItemDTO = z.infer<typeof DeletePatrimonialItemSchema>;