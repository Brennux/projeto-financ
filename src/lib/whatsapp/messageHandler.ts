import type { WASocket, BaileysEventMap } from "baileys";
import { isJidGroup } from "baileys";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { parseMessage } from "@/lib/parser";
import { parsedTransactionSchema } from "@/lib/validation/transaction";
import { extractIncomingIdentity, findUserByIncomingJid } from "./phone";
import { claimLinkCode } from "./linkCode";
import {
  buildConfirmationMessage,
  buildFailureMessage,
  buildLinkConflictMessage,
  buildLinkExpiredMessage,
  buildLinkSuccessMessage,
  buildUnrecognizedSenderMessage,
} from "./replyTemplates";
import { logger } from "./logger";

function extractText(message: BaileysEventMap["messages.upsert"]["messages"][number]): string | null {
  const conteudo = message.message;
  const texto = conteudo?.conversation ?? conteudo?.extendedTextMessage?.text ?? null;
  return texto?.trim() || null;
}

async function replySafely(sock: WASocket, remoteJid: string, texto: string) {
  try {
    await sock.sendMessage(remoteJid, { text: texto });
  } catch (err) {
    // Falha ao responder nunca deve ser confundida com falha de gravacao --
    // a transacao ja foi salva nesse ponto (quando aplicavel).
    logger.error({ err }, "Falha ao enviar mensagem de confirmacao no WhatsApp.");
  }
}

export async function handleMessagesUpsert(sock: WASocket, upsert: BaileysEventMap["messages.upsert"]): Promise<void> {
  // O Baileys reenvia historico como "append" logo apos parear (ou em
  // algumas reconexoes) -- sem esse filtro, mensagens antigas virariam
  // transacoes "novas" na primeira conexao.
  if (upsert.type !== "notify") return;

  for (const msg of upsert.messages) {
    const remoteJid = msg.key.remoteJid;
    // TODO(verificacao manual): confirmar com mensagens reais que
    // remoteJidAlt/addressingMode vem preenchidos e que respostas do proprio
    // bot nao voltam aqui como fromMe -- ver plano de migracao. Remover este
    // log depois de confirmado.
    logger.debug({ key: msg.key }, "whatsapp: raw incoming key");

    // Ecos das nossas proprias respostas (sendMessage) tambem podem chegar
    // aqui -- nunca reprocessar mensagem que o proprio bot mandou.
    if (!remoteJid || msg.key.fromMe) continue;
    // Numero compartilhado nao responde em grupo (remoteJid seria o grupo,
    // nao o remetente real).
    if (isJidGroup(remoteJid)) continue;

    const texto = extractText(msg);
    if (!texto) continue;

    const identity = extractIncomingIdentity(msg.key);
    if (!identity) continue;

    const linkOutcome = await claimLinkCode(texto, identity);
    if (linkOutcome.status === "claimed") {
      await replySafely(sock, remoteJid, buildLinkSuccessMessage(linkOutcome.userName));
      continue;
    }
    if (linkOutcome.status === "expired_or_invalid") {
      await replySafely(sock, remoteJid, buildLinkExpiredMessage());
      continue;
    }
    if (linkOutcome.status === "already_linked_elsewhere") {
      await replySafely(sock, remoteJid, buildLinkConflictMessage());
      continue;
    }
    // "not_a_code" -> segue fluxo normal de despesa

    const user = await findUserByIncomingJid(identity);
    if (!user) {
      await replySafely(sock, remoteJid, buildUnrecognizedSenderMessage());
      continue;
    }

    const parsed = parseMessage(texto);

    if (!parsed) {
      logger.info({ texto }, "Mensagem nao reconhecida pelo parser.");
      await replySafely(sock, remoteJid, buildFailureMessage());
      continue;
    }

    const validado = parsedTransactionSchema.parse(parsed);

    try {
      await prisma.transaction.create({
        data: {
          ...validado,
          mensagemOriginal: texto,
          remetente: remoteJid,
          whatsappMessageId: msg.key.id ?? undefined,
          origem: "whatsapp",
          householdId: user.householdId,
          userId: user.id,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // Mensagem ja processada antes (reenvio do Baileys ao reconectar) --
        // ignora silenciosamente, sem responder de novo.
        logger.info({ whatsappMessageId: msg.key.id }, "Mensagem duplicada, ignorada.");
        continue;
      }
      throw err;
    }

    await replySafely(sock, remoteJid, buildConfirmationMessage(parsed));
  }
}
