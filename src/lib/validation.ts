import { z } from "zod";

export function parseOrError<T>(schema: z.ZodType<T>, data: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data };
  const first = result.error.issues[0];
  return { error: first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input" };
}

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a 6-digit hex code");

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1).max(60).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  type: z.enum(["INCOME", "EXPENSE"]).default("EXPENSE"),
  color: hexColor.default("#6366f1"),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50).optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  color: hexColor.optional(),
  monthlyLimit: z.number().int().positive().nullable().optional(),
});

export const transactionCreateSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.number().int().positive("Amount must be a positive whole number"),
  date: z.string().datetime({ offset: true }),
  note: z.string().max(200, "Note must be 200 characters or fewer").nullable().optional(),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const transactionQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    categoryId: z.string().optional(),
    type: z.enum(["INCOME", "EXPENSE"]).optional(),
    q: z.string().trim().max(100, "Search must be 100 characters or fewer").optional(),
    limit: z.coerce.number().int().min(1).max(1000).default(100),
  })
  .refine((q) => (q.from && q.to) || (!q.from && !q.to), {
    message: "from and to must be provided together",
  });

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Select at least one transaction").max(500),
});

export const exportQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  })
  .refine((q) => (q.from && q.to) || (!q.from && !q.to), {
    message: "from and to must be provided together",
  });

export const accountDeleteSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });