import { z } from "zod";
import dayjs from "dayjs";

export const CreateFinancialPlanningSchema = z.object({
    monthlyIncome: z.number().positive("Renda mensal deve ser um valor positivo"),
    budgetAmount: z.number().positive("Valor do orçamento deve ser positivo"),
    month: z.string()
        .regex(/^\d{4}-\d{2}$/, "Mês deve estar no formato YYYY-MM")
        .refine((month) => {
            const date = dayjs(month, "YYYY-MM");
            return date.isValid();
        }, "Mês inválido"),
    categoryAllocations: z.array(
        z.object({
            categoryId: z.string({ required_error: "ID da categoria é obrigatório" }),
            value: z.number().min(0, "Valor deve ser maior ou igual a zero"),
        })
    ),
});

export type CreateFinancialPlanningRequestDTO = z.infer<typeof CreateFinancialPlanningSchema>;

export const CopyFinancialPlanningSchema = z.object({
    sourceMonth: z.string()
        .regex(/^\d{4}-\d{2}$/, "Mês de origem deve estar no formato YYYY-MM"),
    targetMonth: z.string()
        .regex(/^\d{4}-\d{2}$/, "Mês de destino deve estar no formato YYYY-MM"),
    adjustments: z.object({
        monthlyIncome: z.number().positive("Renda mensal deve ser um valor positivo").optional(),
        budgetAmount: z.number().positive("Valor do orçamento deve ser positivo").optional(),
    }).optional(),
});

export type CopyFinancialPlanningRequestDTO = z.infer<typeof CopyFinancialPlanningSchema>;

export const GetFinancialPlanningSchema = z.object({
    month: z.string()
        .regex(/^\d{4}-\d{2}$/, "Mês deve estar no formato YYYY-MM"),
});

export type GetFinancialPlanningRequestDTO = z.infer<typeof GetFinancialPlanningSchema>;

export const UpdateFinancialPlanningSchema = z.object({
    id: z.string({ required_error: "ID do planejamento é obrigatório" }),
    monthlyIncome: z.number().positive("Renda mensal deve ser um valor positivo").optional(),
    budgetAmount: z.number().positive("Valor do orçamento deve ser positivo").optional(),
    categoryAllocations: z.array(
        z.object({
            categoryId: z.string({ required_error: "ID da categoria é obrigatório" }),
            value: z.number().min(0, "Valor deve ser maior ou igual a zero"),
        })
    ).optional(),
});

export type UpdateFinancialPlanningRequestDTO = z.infer<typeof UpdateFinancialPlanningSchema>;

export const DeleteFinancialPlanningSchema = z.object({
    id: z.string({ required_error: "ID da categoria é obrigatório" }),
});

export type DeleteFinancialPlanningRequestDTO = z.infer<typeof DeleteFinancialPlanningSchema>;

export const RemoveCategoryAllocationSchema = z.object({
    planningId: z.string({ required_error: "ID do planejamento é obrigatório" }),
    categoryId: z.string({ required_error: "ID da categoria é obrigatório" }),
});

export type RemoveCategoryAllocationRequestDTO = z.infer<typeof RemoveCategoryAllocationSchema>;
