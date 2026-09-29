import prisma from "@/lib/prisma";

// Id fixo -- so existe UMA linha de WhatsAppSession (a conexao Baileys
// compartilhada por todo o household). O upsert abaixo so reaproveita essa
// linha porque o id tambem esta em `create`: sem isso, o `where` nao
// influencia o valor gerado em `create` (@default(cuid())), e cada chamada
// criaria uma linha nova em vez de reaproveitar a singleton.
export const WHATSAPP_SESSION_ID = "singleton";

export function getOrCreateSession() {
  return prisma.whatsAppSession.upsert({
    where: { id: WHATSAPP_SESSION_ID },
    update: {},
    create: { id: WHATSAPP_SESSION_ID },
  });
}
