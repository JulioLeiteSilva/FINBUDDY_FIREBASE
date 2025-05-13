import { z } from "zod";
import { UserStatus } from "../enums/UserStatus";

export const UserPreRegisterSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must not exceed 100 characters")
    .regex(/^[a-zA-Z\s]*$/, "Name must contain only letters and spaces"),

  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters"),

  status: z.nativeEnum(UserStatus, {
    errorMap: () => ({ message: "Invalid user status" }),
  }),

  createdAt: z.coerce.date().default(() => new Date()),
});

export type UserPreRegisterDTO = z.infer<typeof UserPreRegisterSchema>;
