"use server";

import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth/dal";
import { generateLinkCode } from "@/lib/whatsapp/linkCode";

export async function generateMyLinkCode(): Promise<{ code: string; expiraEm: string }> {
  const session = await verifySession();
  const { code, expiraEm } = await generateLinkCode(session.userId);
  return { code, expiraEm: expiraEm.toISOString() };
}

export interface MyLinkStatus {
  linked: boolean;
  telefone: string | null;
  linkedAt: string | null;
}

export async function getMyLinkStatus(): Promise<MyLinkStatus> {
  const session = await verifySession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { telefone: true, whatsAppLinkedAt: true },
  });
  return {
    linked: user.whatsAppLinkedAt !== null,
    telefone: user.telefone,
    linkedAt: user.whatsAppLinkedAt?.toISOString() ?? null,
  };
}

/**
 * Remove o vinculo do numero do usuario logado. As mensagens desse numero
 * deixam de virar lancamento (o bot passa a responder "remetente nao
 * reconhecido"); os lancamentos ja feitos continuam no household. Pra
 * vincular de novo (o mesmo numero ou outro), e so gerar um novo codigo.
 */
export async function unlinkMyWhatsApp(): Promise<MyLinkStatus> {
  const session = await verifySession();
  await prisma.user.update({
    where: { id: session.userId },
    data: { whatsAppJid: null, whatsAppJidAlt: null, telefone: null, whatsAppLinkedAt: null },
  });
  return { linked: false, telefone: null, linkedAt: null };
}
