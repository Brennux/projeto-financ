import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestWaWebVersion,
  DisconnectReason,
  type WASocket,
  type BaileysEventMap,
} from "baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import prisma from "@/lib/prisma";
import type { WhatsAppStatus } from "./types";

const LOG_LEVEL = process.env.WHATSAPP_LOG_LEVEL ?? "info";
// fetchLatestWaWebVersion() nao tem timeout proprio: se o WhatsApp Web ficar
// inacessivel (rede/proxy/firewall), o fetch trava pra sempre e, como
// makeWASocket so roda depois dele, a conta fica presa no Map `active` do
// worker sem nenhum erro, log ou retry ate o processo ser reiniciado.
const WA_VERSION_FETCH_TIMEOUT_MS = 15_000;

export const logger = pino({ level: LOG_LEVEL });

function updateAccount(
  userId: string,
  data: { status: WhatsAppStatus; qr?: string | null; phoneNumber?: string | null },
) {
  return prisma.whatsAppAccount.update({ where: { userId }, data }).catch((err: unknown) => {
    logger.error({ err, userId }, "Falha ao gravar status do WhatsApp no banco.");
  });
}

export type MessageUpsertHandler = (
  sock: WASocket,
  upsert: BaileysEventMap["messages.upsert"],
) => void | Promise<void>;

export interface ConnectionContext {
  userId: string;
  authDir: string;
  /** Chamado quando a conexao termina de vez (logged out) e nao vai mais reconectar sozinha. */
  onTerminal?: () => void;
}

/**
 * Sobe a conexao com o WhatsApp de UM usuario e reconecta automaticamente em
 * quedas, a menos que o motivo seja "loggedOut" (sessao invalidada -- o
 * usuario precisa clicar em "conectar" de novo no dashboard e escanear o QR).
 * O status/QR de cada tentativa fica gravado em WhatsAppAccount, que e o que
 * o dashboard le pra mostrar o QR e o progresso do pareamento.
 */
export async function connectWhatsApp(ctx: ConnectionContext, onMessages: MessageUpsertHandler): Promise<WASocket> {
  const { userId, authDir, onTerminal } = ctx;

  // Nao e um hook React -- e um utilitario do baileys que so por acaso comeca com "use".
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  // fetchLatestBaileysVersion() ficou desatualizada em relacao ao protocolo
  // real do WhatsApp Web em versoes recentes do baileys (issue #2679) e
  // causa falha de pareamento ("verifique sua conexao" no celular). A
  // versao realmente atual vem de fetchLatestWaWebVersion() -- se essa busca
  // falhar/estourar o timeout, ela cai num fallback pra versao desatualizada
  // do proprio pacote, ou seja, a MESMA versao que causa aquele erro. Por
  // isso nao da pra so pegar `version` e seguir: sem isLatest, prosseguiria
  // em silencio com uma versao que o WhatsApp vai rejeitar.
  const { version, isLatest, error: versionError } = await fetchLatestWaWebVersion({
    signal: AbortSignal.timeout(WA_VERSION_FETCH_TIMEOUT_MS),
  });
  if (!isLatest) {
    throw new Error("Nao foi possivel obter a versao atual do WhatsApp Web", { cause: versionError });
  }

  const sock = makeWASocket({
    auth: state,
    logger,
    version,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info({ userId }, "Escaneie o QR code no WhatsApp: Aparelhos conectados > Conectar um aparelho");
      qrcode.generate(qr, { small: true });
      void updateAccount(userId, { status: "qr_ready", qr });
    }

    if (connection === "open") {
      logger.info({ userId }, "Conectado ao WhatsApp.");
      void updateAccount(userId, {
        status: "connected",
        qr: null,
        phoneNumber: sock.user?.phoneNumber ?? sock.user?.id ?? null,
      });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
        ?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ userId, statusCode }, "Conexao com o WhatsApp encerrada.");

      if (shouldReconnect) {
        void updateAccount(userId, { status: "disconnected", qr: null });
        void connectWhatsApp(ctx, onMessages);
      } else {
        logger.error({ userId }, "Sessao invalidada (logged out). Reconecte pelo dashboard para reescanear o QR.");
        void updateAccount(userId, { status: "logged_out", qr: null });
        onTerminal?.();
      }
    }
  });

  sock.ev.on("messages.upsert", (upsert) => {
    void onMessages(sock, upsert);
  });

  return sock;
}
