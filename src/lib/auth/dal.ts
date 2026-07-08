import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt, type SessionPayload } from "./session";

async function readSession(): Promise<SessionPayload | undefined> {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get("session")?.value);
}

/**
 * Para uso em paginas/rotas que exigem autenticacao -- redireciona pra
 * /login se a sessao nao existir ou for invalida.
 */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await readSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

/**
 * Para uso em paginas publicas que precisam se comportar diferente quando
 * ja existe uma sessao (ex.: /invite/[token]) -- nunca redireciona.
 */
export const getOptionalSession = cache(async (): Promise<SessionPayload | undefined> => {
  return readSession();
});
