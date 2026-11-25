import type { WASocket, BaileysEventMap } from "baileys";
import { isJidGroup } from "baileys";
import { Prisma } from "@/generated/prisma";
import { parseMessage } from "@/lib/parser";
import { normalize } from "@/lib/parser/normalize";
import { parsedTransactionSchema } from "@/lib/validation/transaction";
import { extractIncomingIdentity, findUserByIncomingJid } from "./phone";
import { claimLinkCode } from "./linkCode";
import { regrasDoHousehold } from "@/lib/categorias/server";
import { getCartoes, registrarLancamento } from "@/lib/cartoes/server";
import { escolherCartao, PERGUNTAR_CARTAO } from "@/lib/cartoes/escolha";
import type { Parcela } from "@/lib/cartoes/fatura";
import { detectarComando } from "./comandos";
import { alertaOrcamentoAposDespesa, responderComando } from "./consultas";
import {
  buildConfirmacaoCompra,
  buildConfirmationMessage,
  buildFailureMessage,
  buildQualCartaoMessage,
  buildLinkConflictMessage,
  buildLinkExpiredMessage,
  buildLinkSuccessMessage,
  buildUnrecognizedSenderMessage,
} from "./replyTemplates";
import { logger } from "./logger";

// Comandos nao gravam nada com whatsappMessageId (que e o que deduplica os
// lancamentos), entao um reenvio do Baileys ao reconectar executaria o mesmo
// "desfazer" duas vezes. Guarda os ids dos comandos ja respondidos.
const MAX_COMANDOS_LEMBRADOS = 500;
const comandosProcessados = new Set<string>();

function jaProcessouComando(messageId: string | null | undefined): boolean {
  if (!messageId) return false;
  if (comandosProcessados.has(messageId)) return true;
  comandosProcessados.add(messageId);
  if (comandosProcessados.size > MAX_COMANDOS_LEMBRADOS) {
    const maisAntigo = comandosProcessados.values().next().value;
    if (maisAntigo) comandosProcessados.delete(maisAntigo);
  }
  return false;
}

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

    const comando = detectarComando(texto);
    if (comando) {
      if (jaProcessouComando(msg.key.id)) continue;
      try {
        await replySafely(sock, remoteJid, await responderComando(comando, user));
      } catch (err) {
        logger.error({ err, comando }, "Falha ao responder comando do WhatsApp.");
        await replySafely(sock, remoteJid, "😕 Não consegui responder agora. Tente de novo em instantes.");
      }
      continue;
    }

    // Categorias do proprio household (personalizaveis), nao as padrao.
    const parsed = parseMessage(texto, new Date(), await regrasDoHousehold(user.householdId));

    if (!parsed) {
      logger.info({ texto }, "Mensagem nao reconhecida pelo parser.");
      await replySafely(sock, remoteJid, buildFailureMessage());
      continue;
    }

    const validado = parsedTransactionSchema.parse(parsed);
    const numeroDeParcelas = parsed.parcelas ?? 1;

    // Cartao: pelo nome na mensagem, ou o unico cadastrado quando ela fala em
    // credito/parcelas. Com varios e nenhum citado, pergunta em vez de chutar.
    const cartoes = validado.tipo === "despesa" ? await getCartoes(user.householdId) : [];
    const cartao = escolherCartao(normalize(texto), cartoes, {
      noCredito: parsed.noCredito ?? false,
      parcelas: numeroDeParcelas,
    });
    if (cartao === PERGUNTAR_CARTAO) {
      await replySafely(sock, remoteJid, buildQualCartaoMessage(cartoes.map((c) => c.nome)));
      continue;
    }

    let parcelas: Parcela[];
    try {
      parcelas = await registrarLancamento({
        householdId: user.householdId,
        userId: user.id,
        tipo: validado.tipo,
        valorTotal: validado.valor,
        categoria: validado.categoria,
        descricao: validado.descricao,
        dataCompra: validado.data,
        parcelas: numeroDeParcelas,
        cartao,
        origem: "whatsapp",
        whatsappMessageId: msg.key.id ?? undefined,
        mensagemOriginal: texto,
        remetente: remoteJid,
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

    // Aviso de orcamento e um extra: se falhar, a confirmacao sai mesmo assim.
    // Conta no mes em que a (1a) parcela conta -- no cartao, o da fatura.
    const alerta =
      validado.tipo === "despesa"
        ? await alertaOrcamentoAposDespesa(user.householdId, validado.categoria, parcelas[0].data).catch(
            (err: unknown) => {
              logger.error({ err }, "Falha ao calcular aviso de orcamento.");
              return null;
            },
          )
        : null;

    const confirmacao =
      cartao || parcelas.length > 1
        ? buildConfirmacaoCompra(
            { valorTotal: validado.valor, categoria: validado.categoria, cartaoNome: cartao?.nome ?? null, parcelas },
            alerta,
          )
        : buildConfirmationMessage(validado, alerta);
    await replySafely(sock, remoteJid, confirmacao);
  }
}
