import type { WASocket, BaileysEventMap } from "baileys";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { parseMessage } from "@/lib/parser";
import { parsedTransactionSchema } from "@/lib/validation/transaction";
import { isOwnerSelfChat } from "./allowlist";
import { buildConfirmationMessage, buildFailureMessage } from "./replyTemplates";
import { logger } from "./connection";

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

export interface MessageContext {
  userId: string;
  householdId: string;
}

export async function handleMessagesUpsert(
  sock: WASocket,
  upsert: BaileysEventMap["messages.upsert"],
  ctx: MessageContext,
): Promise<void> {
  // O Baileys reenvia historico como "append" logo apos parear (ou em
  // algumas reconexoes) -- sem esse filtro, mensagens antigas do self-chat
  // virariam transacoes "novas" na primeira conexao.
  if (upsert.type !== "notify") return;

  for (const msg of upsert.messages) {
    const remoteJid = msg.key.remoteJid;
    if (!isOwnerSelfChat(remoteJid, sock.user) || !remoteJid) continue;

    const texto = extractText(msg);
    if (!texto) continue;

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
          householdId: ctx.householdId,
          userId: ctx.userId,
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
