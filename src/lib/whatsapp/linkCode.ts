import { randomInt } from "node:crypto";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { formatBrazilianPhoneForDisplay, type IncomingIdentity } from "./phone";
import { logger } from "./logger";

const CODE_LENGTH = 6;
const CODE_TTL_MS = 10 * 60 * 1000;

interface LinkCodeRedeemabilityInput {
  expiraEm: Date;
  usadoEm: Date | null;
}

export function isLinkCodeClaimable(linkCode: LinkCodeRedeemabilityInput, now: Date = new Date()): boolean {
  return linkCode.usadoEm === null && linkCode.expiraEm > now;
}

export type ClaimOutcome =
  | { status: "not_a_code" }
  | { status: "expired_or_invalid" }
  | { status: "already_linked_elsewhere" }
  | { status: "claimed"; userName: string };

function generateNumericCode(): string {
  return randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, "0");
}

/**
 * Gera (ou substitui) o codigo pendente de um usuario. Upsert por userId --
 * ao contrario do convite de casa (compartilhado com outra pessoa, varios
 * podem coexistir), o codigo de vinculacao e gerado e usado pela mesma
 * pessoa na mesma sessao, entao gerar de novo substitui o anterior em vez
 * de deixar ambiguidade de "qual dos meus codigos e o valido".
 */
export async function generateLinkCode(userId: string): Promise<{ code: string; expiraEm: Date }> {
  const expiraEm = new Date(Date.now() + CODE_TTL_MS);
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const code = generateNumericCode();
    try {
      await prisma.whatsAppLinkCode.upsert({
        where: { userId },
        update: { code, expiraEm, usadoEm: null },
        create: { userId, code, expiraEm },
      });
      return { code, expiraEm };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue; // codigo colidiu com o de outra pessoa
      throw err;
    }
  }
  throw new Error("Nao foi possivel gerar um codigo de vinculacao unico apos 5 tentativas.");
}

/**
 * Mesmo padrao atomico do resgate de convite de casa (ver signup() em
 * src/app/actions/auth.ts): reivindica o codigo com um updateMany guardado
 * por usadoEm/expiraEm, e so entao grava a identidade -- tudo numa unica
 * transacao, entao se a gravacao falhar (JID ja pertence a outro usuario) a
 * reivindicacao do codigo tambem desfaz, e nao fica queimado a toa.
 */
export async function claimLinkCode(text: string, identity: IncomingIdentity): Promise<ClaimOutcome> {
  const pending = await prisma.whatsAppLinkCode.findUnique({ where: { code: text } });
  if (!pending) return { status: "not_a_code" };

  try {
    const userName = await prisma.$transaction(async (tx) => {
      const claim = await tx.whatsAppLinkCode.updateMany({
        where: { id: pending.id, usadoEm: null, expiraEm: { gt: new Date() } },
        data: { usadoEm: new Date() },
      });
      if (claim.count === 0) throw new Error("CODIGO_INVALIDO");

      const user = await tx.user.update({
        where: { id: pending.userId },
        data: {
          whatsAppJid: identity.jid,
          whatsAppJidAlt: identity.jidAlt,
          telefone:
            formatBrazilianPhoneForDisplay(identity.jid) ??
            (identity.jidAlt ? formatBrazilianPhoneForDisplay(identity.jidAlt) : null),
          whatsAppLinkedAt: new Date(),
        },
      });
      return user.nome;
    });
    return { status: "claimed", userName };
  } catch (err) {
    if (err instanceof Error && err.message === "CODIGO_INVALIDO") return { status: "expired_or_invalid" };
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      logger.error({ identity, userId: pending.userId }, "Numero de WhatsApp ja vinculado a outro usuario.");
      return { status: "already_linked_elsewhere" };
    }
    throw err;
  }
}
