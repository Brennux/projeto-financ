/**
 * Utilitario de dev: interpreta uma mensagem via linha de comando e grava no
 * banco, sem precisar do WhatsApp rodando. Util pra testar o parser contra o
 * banco real e, mais tarde, pra depurar mensagens que o bot nao entendeu.
 *
 * Uso: npm run parse:test -- "Paguei 58,90 no mercado"
 */
import { parseMessage } from "../src/lib/parser";
import { parsedTransactionSchema } from "../src/lib/validation/transaction";
import prisma from "../src/lib/prisma";

async function main() {
  const mensagem = process.argv.slice(2).join(" ");
  if (!mensagem) {
    console.error('Uso: npm run parse:test -- "Paguei 58,90 no mercado"');
    process.exitCode = 1;
    return;
  }

  const parsed = parseMessage(mensagem);
  if (!parsed) {
    console.error("Nao consegui entender essa mensagem.");
    process.exitCode = 1;
    return;
  }

  const validated = parsedTransactionSchema.parse(parsed);

  // Script de debug, sem sessao -- usa o primeiro household que existir no
  // banco (basta ter cadastrado um usuario pelo /signup antes de rodar isso).
  const household = await prisma.household.findFirst();
  if (!household) {
    console.error("Nenhum household encontrado. Cadastre um usuario em /signup antes de rodar este script.");
    process.exitCode = 1;
    return;
  }

  const transacao = await prisma.transaction.create({
    data: {
      ...validated,
      mensagemOriginal: mensagem,
      origem: "manual-script",
      householdId: household.id,
    },
  });

  console.log("Transacao salva:");
  console.log(transacao);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
