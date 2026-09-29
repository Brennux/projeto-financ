// Import profundo de proposito, sem passar pelo barrel "baileys" (lib/index.js):
// o barrel reexporta Utils/messages-media.js, que faz import() dinamico de
// `jimp`/`sharp` -- pacotes opcionais que este projeto nao instala. Em
// runtime isso e inofensivo (tem .catch() e a gente nunca baixa midia por
// aqui), mas o bundler do Next tenta resolver esse import() em build-time e
// quebra com "Module not found", especialmente porque este arquivo e
// alcancado a partir de um Client Component (WhatsAppLinkPanel ->
// actions/whatsapp.ts -> linkCode.ts -> phone.ts). jid-utils.js nao tem
// nenhuma dependencia propria, entao o import direto evita o problema todo.
import { jidDecode, jidNormalizedUser, isPnUser } from "baileys/lib/WABinary/jid-utils.js";
import type { WAMessageKey } from "baileys/lib/Types/Message.js";
import prisma from "@/lib/prisma";

export interface IncomingIdentity {
  /** Forma que o servidor usou pra enderecar a mensagem (@s.whatsapp.net ou @lid), ja normalizada. */
  jid: string;
  /** Forma alternativa PN<->LID que o servidor reporta no mesmo envelope, quando presente. */
  jidAlt: string | null;
}

export function extractIncomingIdentity(key: Pick<WAMessageKey, "remoteJid" | "remoteJidAlt">): IncomingIdentity | null {
  if (!key.remoteJid) return null;
  return {
    jid: jidNormalizedUser(key.remoteJid),
    jidAlt: key.remoteJidAlt ? jidNormalizedUser(key.remoteJidAlt) : null,
  };
}

/**
 * Compara as duas formas (JID primario + alternativo PN<->LID) dos dois
 * lados, em vez de reduzir tudo a uma unica string canonica -- sobrevive o
 * WhatsApp trocar qual endereçamento (PN ou LID) ele usa por padrao com o
 * tempo, sem precisar re-vincular ninguem.
 */
export function identitiesOverlap(a: IncomingIdentity, b: IncomingIdentity): boolean {
  const bForms = [b.jid, b.jidAlt].filter((v): v is string => v !== null);
  return bForms.includes(a.jid) || (a.jidAlt !== null && bForms.includes(a.jidAlt));
}

export async function findUserByIncomingJid(identity: IncomingIdentity): Promise<{ id: string; householdId: string } | null> {
  // Household e pequeno (poucos usuarios) -- compara em memoria com uma
  // funcao pura testavel em vez de empurrar a logica de casamento pro SQL.
  const linked = await prisma.user.findMany({
    where: { whatsAppJid: { not: null } },
    select: { id: true, householdId: true, whatsAppJid: true, whatsAppJidAlt: true },
  });
  const match = linked.find((u) => identitiesOverlap(identity, { jid: u.whatsAppJid as string, jidAlt: u.whatsAppJidAlt }));
  return match ? { id: match.id, householdId: match.householdId } : null;
}

/** So pra exibicao -- nunca participa do casamento/autenticacao. */
export function formatBrazilianPhoneForDisplay(jid: string): string | null {
  if (!isPnUser(jid)) return null; // @lid nao tem numero derivavel
  const digits = jidDecode(jid)?.user;
  if (!digits) return null;
  if (!digits.startsWith("55") || digits.length < 12) return `+${digits}`;
  const ddd = digits.slice(2, 4);
  let assinante = digits.slice(4);
  if (assinante.length === 8) assinante = `9${assinante}`; // reinsere o "9" que as vezes falta
  return `+55 ${ddd} ${assinante.slice(0, 5)}-${assinante.slice(5)}`;
}
