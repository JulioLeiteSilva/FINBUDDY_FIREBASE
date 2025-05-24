import { z } from "zod";

export const CategoryRequestSchema = z.object({
  name: z
    .string()
    .min(2, "O nome da categoria deve ter no mínimo 2 caracteres")
    .max(50, "O nome da categoria deve ter no máximo 50 caracteres"),

  type: z.enum(["INCOME", "EXPENSE"], {
    errorMap: () => ({ message: "O tipo deve ser INCOME ou EXPENSE" }),
  }),

  icon: z
    .string()
    .min(1, "O nome do ícone é obrigatório")
    .max(50, "O nome do ícone deve ter no máximo 50 caracteres"),
});

export type CategoryRequestDTO = z.infer<typeof CategoryRequestSchema>;
