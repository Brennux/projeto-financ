import pino from "pino";

// Modulo separado de proposito: so pino, zero dependencia do pacote
// `baileys`. `connection.ts` (que faz makeWASocket, socket de verdade) so e
// importado pelo worker, mas `linkCode.ts`/`phone.ts` sao alcancados a
// partir de um Client Component (WhatsAppLinkPanel -> actions/whatsapp.ts).
// Se o logger vivesse em connection.ts, esses dois puxariam o pacote
// `baileys` inteiro pro bundle do navegador (que tenta resolver import()
// dinamico de `jimp`/`sharp` em Utils/messages-media.js e quebra o build,
// mesmo esses pacotes nunca sendo usados de verdade).
const LOG_LEVEL = process.env.WHATSAPP_LOG_LEVEL ?? "info";

export const logger = pino({ level: LOG_LEVEL });
