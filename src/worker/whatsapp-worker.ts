import type { WASocket } from "baileys";
import { connectWhatsApp } from "@/lib/whatsapp/connection";
import { handleMessagesUpsert } from "@/lib/whatsapp/messageHandler";
import { getOrCreateSession } from "@/lib/whatsapp/session";
import { logger } from "@/lib/whatsapp/logger";

const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR ?? ".baileys-auth";
const POLL_INTERVAL_MS = 3000;

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

async function main(): Promise<void> {
  logger.info("Worker do WhatsApp iniciado, monitorando a sessao compartilhada.");

  for (;;) {
    try {
      await tick();
    } catch (err) {
      logger.error({ err }, "Erro no ciclo de reconexao do worker.");
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main().catch((err) => {
  logger.error({ err }, "Falha fatal no worker do WhatsApp.");
  process.exit(1);
});
