import path from "node:path";
import type { WASocket } from "baileys";
import prisma from "@/lib/prisma";
import { connectWhatsApp, logger } from "@/lib/whatsapp/connection";
import { handleMessagesUpsert } from "@/lib/whatsapp/messageHandler";

const AUTH_DIR = process.env.WHATSAPP_AUTH_DIR ?? ".baileys-auth";
const POLL_INTERVAL_MS = 3000;

// null = reivindicado, handshake do Baileys ainda em andamento.
const active = new Map<string, WASocket | null>();

async function startConnection(userId: string, householdId: string): Promise<void> {
  if (active.has(userId)) return;
  active.set(userId, null);

  try {
    const sock = await connectWhatsApp(
      {
        userId,
        authDir: path.join(AUTH_DIR, userId),
        onTerminal: () => active.delete(userId),
      },
      (sock, upsert) => handleMessagesUpsert(sock, upsert, { userId, householdId }),
    );
    active.set(userId, sock);
  } catch (err) {
    active.delete(userId);
    logger.error({ err, userId }, "Falha ao iniciar conexao do WhatsApp, tenta de novo no proximo ciclo.");
  }
}

/**
 * Um unico ciclo cobre tanto "retomar no boot" quanto "notar pareamento
 * novo": busca tudo que nao esteja logged_out (pending/connecting/qr_ready/
 * connected/disconnected) e garante que exista uma conexao ativa em memoria
 * pra cada um. Contas "pending" sao reivindicadas atomicamente antes de
 * iniciar a conexao, pra nunca abrir duas sessoes Baileys pro mesmo usuario
 * (ex.: se por engano rodar duas instancias deste worker).
 */
async function tick(): Promise<void> {
  const accounts = await prisma.whatsAppAccount.findMany({
    where: { status: { not: "logged_out" } },
    select: { userId: true, status: true, user: { select: { householdId: true } } },
  });

  for (const account of accounts) {
    if (active.has(account.userId)) continue;

    if (account.status === "pending") {
      const claim = await prisma.whatsAppAccount.updateMany({
        where: { userId: account.userId, status: "pending" },
        data: { status: "connecting" },
      });
      if (claim.count === 0) continue; // outro ciclo/instancia ja reivindicou
    }

    void startConnection(account.userId, account.user.householdId);
  }
}

async function main(): Promise<void> {
  logger.info("Worker do WhatsApp iniciado, monitorando contas pendentes/conectadas.");

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
