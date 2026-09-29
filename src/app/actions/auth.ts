"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { createSession, deleteSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword, DUMMY_HASH } from "@/lib/auth/password";
import { signupSchema, loginSchema } from "@/lib/validation/auth";
import { isInviteRedeemable } from "@/lib/household/invites";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
}

export async function signup(_state: AuthFormState | undefined, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    nome: formData.get("nome"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteToken: formData.get("inviteToken") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { nome, email, password, inviteToken } = parsed.data;
  const senhaHash = await hashPassword(password);

  let session: { userId: string; householdId: string };

  try {
    const user = await prisma.$transaction(async (tx) => {
      let householdId: string;

      if (inviteToken) {
        const invite = await tx.householdInvite.findUnique({ where: { token: inviteToken } });
        if (!invite || !isInviteRedeemable(invite)) {
          throw new Error("CONVITE_INVALIDO");
        }
        const claim = await tx.householdInvite.updateMany({
          where: { id: invite.id, usadoEm: null, expiraEm: { gt: new Date() } },
          data: { usadoEm: new Date() },
        });
        if (claim.count === 0) {
          throw new Error("CONVITE_INVALIDO");
        }
        householdId = invite.householdId;
      } else {
        const household = await tx.household.create({ data: { name: nome } });
        householdId = household.id;
      }

      return tx.user.create({ data: { nome, email, senhaHash, householdId } });
    });

    session = { userId: user.id, householdId: user.householdId };
  } catch (err) {
    if (err instanceof Error && err.message === "CONVITE_INVALIDO") {
      return { error: "Convite invalido, expirado ou ja utilizado." };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { email: ["Ja existe uma conta com esse email."] } };
    }
    throw err;
  }

  await createSession(session.userId, session.householdId);
  redirect("/");
}

export async function login(_state: AuthFormState | undefined, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  // Compara sempre, mesmo se o usuario nao existir, pra login com email
  // inexistente levar o mesmo tempo de senha errada (evita enumerar contas).
  const senhaOk = await verifyPassword(password, user?.senhaHash ?? DUMMY_HASH);

  if (!user || !senhaOk) {
    return { error: "Email ou senha invalidos." };
  }

  await createSession(user.id, user.householdId);
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
