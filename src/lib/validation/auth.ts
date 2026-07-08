import { z } from "zod";

const emailSchema = z.email({ error: "Informe um email valido." }).trim().toLowerCase();

const passwordSchema = z
  .string()
  .min(8, { error: "A senha precisa ter pelo menos 8 caracteres." })
  .regex(/[a-zA-Z]/, { error: "A senha precisa ter pelo menos uma letra." })
  .regex(/[0-9]/, { error: "A senha precisa ter pelo menos um numero." });

export const signupSchema = z.object({
  nome: z.string().trim().min(2, { error: "Informe seu nome." }),
  email: emailSchema,
  password: passwordSchema,
  inviteToken: z.string().trim().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
