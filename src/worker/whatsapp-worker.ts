import type { WASocket } from "baileys";
import { connectWhatsApp } from "@/lib/whatsapp/connection";
import { handleMessagesUpsert } from "@/lib/whatsapp/messageHandler";
import { getOrCreateSession } from "@/lib/whatsapp/session";
import { materializarRecorrencias } from "@/lib/recorrencias/server";
import { logger } from "@/lib/whatsapp/logger";

const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR ?? ".baileys-auth";
const POLL_INTERVAL_MS = 3000;
/** De quanto em quanto tempo gera os lancamentos recorrentes que venceram (de todos os households). */
const RECORRENCIAS_INTERVAL_MS = 60 * 60 * 1000;

let ultimaRecorrencia = 0;

let active: WASocket | null = null;
let starting = false;

async function startConnection(): Promise<void> {
  if (active || starting) return;
  starting = true;
  try {
    active = await connectWhatsApp(
      { authDir: AUTH_DIR, onTerminal: () => { active = null; } },
      handleMessagesUpsert,
    );
  } catch (err) {
    logger.error({ err }, "Falha ao iniciar conexao do WhatsApp, tenta de novo no proximo ciclo.");
  } finally {
    starting = false;
  }
}

/**
 * Ha uma unica conexao Baileys compartilhada por todo o household (ao
 * contrario do antigo modelo de N contas/N sockets), entao nao precisa mais
 * de claim atomico entre contas concorrentes -- so reagir ao status da linha
 * singleton pra saber se deve (re)conectar ou esperar o clique manual em
 * "Reconectar" (apos um logged_out).
 */
async function tick(): Promise<void> {
  if (active) return;
  const session = await getOrCreateSession();
  if (session.status === "logged_out") return;
  void startConnection();
}

/**
 * O app tambem gera os recorrentes ao abrir o dashboard, mas o worker roda
 * 24h: assim o lancamento existe no dia certo mesmo sem ninguem abrir o app
 * (e o "saldo" pelo WhatsApp ja considera ele).
 */
async function gerarRecorrencias(): Promise<void> {
  if (Date.now() - ultimaRecorrencia < RECORRENCIAS_INTERVAL_MS) return;
  ultimaRecorrencia = Date.now();
  const criadas = await materializarRecorrencias();
  if (criadas > 0) logger.info({ criadas }, "Lancamentos recorrentes gerados.");
}

async function main(): Promise<void> {
  logger.info("Worker do WhatsApp iniciado, monitorando a sessao compartilhada.");

  for (;;) {
    try {
      await tick();
    } catch (err) {
      logger.error({ err }, "Erro no ciclo de reconexao do worker.");
    }
    try {
      await gerarRecorrencias();
    } catch (err) {
      logger.error({ err }, "Erro ao gerar lancamentos recorrentes.");
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((err) => {
  logger.error({ err }, "Falha fatal no worker do WhatsApp.");
  process.exit(1);
});
