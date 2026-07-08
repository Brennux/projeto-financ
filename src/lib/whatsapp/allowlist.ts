import { areJidsSameUser, type Contact } from "baileys";

/**
 * O Baileys pareia com a SUA propria conta (dispositivo vinculado, igual ao
 * WhatsApp Web) -- ele enxerga toda conversa sua, e em mensagens que voce
 * mesmo envia o remetente e sempre "voce", em qualquer chat. Por isso NAO
 * da pra filtrar por numero de remetente: isso nao distingue "isso e um
 * gasto" de "so estou mandando mensagem pra um amigo".
 *
 * A escolha certa e isolar por CONVERSA: so processar mensagens onde o
 * `remoteJid` e o proprio JID do dono (o chat "Mensagens para voce mesmo"
 * do WhatsApp). So o dono pode escrever nessa conversa, entao a seguranca
 * vem de graca, e nenhuma conversa real com outras pessoas corre risco de
 * disparar o parser por engano.
 *
 * O WhatsApp usa dois esquemas de endereco diferentes pra mesma conta -- o
 * tradicional baseado em numero de telefone (@s.whatsapp.net) e o mais novo
 * "LID" (@lid, um identificador opaco por privacidade) -- e mensagens do
 * self-chat podem chegar rotuladas com qualquer um dos dois dependendo do
 * evento. Por isso comparamos contra TODOS os IDs que o proprio socket
 * reporta como "eu" (sock.user), em vez de reconstruir um JID a partir de
 * um numero digitado no .env -- isso tambem evita a ambiguidade do digito
 * "9" extra nos numeros de celular brasileiros (o WhatsApp as vezes reporta
 * o numero sem esse digito).
 */
export function isOwnerSelfChat(remoteJid: string | null | undefined, me: Contact | undefined): boolean {
  if (!remoteJid || !me) return false;
  return (
    areJidsSameUser(remoteJid, me.id) ||
    areJidsSameUser(remoteJid, me.lid) ||
    areJidsSameUser(remoteJid, me.phoneNumber)
  );
}
