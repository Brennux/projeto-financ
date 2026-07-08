# Projeto App Financeiro

App de controle financeiro multi-usuário. Cada conta pertence a um **household** (grupo familiar/casal) — todos os membros de um household compartilham a mesma lista de transações, e cada membro pareia seu **próprio** WhatsApp pra lançar gastos. Duas partes rodam separadamente e compartilham o mesmo banco Postgres via Prisma:

1. **Next.js app** (`src/app`) — login/cadastro, dashboard de transações (`/transactions`), configurações de household/WhatsApp, e API REST (`/api/transactions`).
2. **Worker do WhatsApp** ([src/worker/whatsapp-worker.ts](src/worker/whatsapp-worker.ts)) — processo à parte, de longa duração, que gerencia **uma conexão Baileys por usuário pareado** e transforma mensagens do próprio chat de cada um ("Mensagens para você mesmo") em lançamentos financeiros no household correspondente.

## Stack

- Next.js 16 (App Router) + React 19
- Prisma 7 (`@prisma/adapter-pg`) + Postgres
- Baileys (WhatsApp multi-device) + Pino (logs)
- Auth própria (sem biblioteca externa): `jose` (JWT em cookie httpOnly) + `bcryptjs` (senha) — ver "Autenticação" abaixo
- Zod (validação), Vitest (testes)

## Arquitetura

```
WhatsApp (self-chat de cada usuário) → worker (1 conexão Baileys por usuário)
  → parser → Zod → Prisma (Transaction.householdId + userId) → Postgres
  ← API/Next.js (autenticado, escopado por household) → dashboard
```

- Cada usuário pareia **seu próprio número** de WhatsApp (não um número "bot" compartilhado) — mantém o modelo de segurança original (só o self-chat de cada um é lido, ver [allowlist.ts](src/lib/whatsapp/allowlist.ts)) sem risco de banimento por comportamento automatizado.
- Duas ou mais pessoas podem pertencer ao mesmo household (o caso "casal"): basta uma convidar a outra (`/settings/household` → gerar convite). Todo lançamento — de qualquer membro, via WhatsApp ou manual — cai na mesma lista compartilhada (`Transaction.householdId`), atribuído a quem enviou (`Transaction.userId`).
- Pareamento do WhatsApp é **mediado pelo banco**, não por acoplamento direto entre o Next.js e o worker: o dashboard grava a intenção de conectar em `WhatsAppAccount` (status `pending`), o worker faz polling (a cada 3s) e reage — gravando QR/status de volta na mesma tabela — e o dashboard exibe o QR fazendo polling do status (a cada 2s). Ver `/settings/whatsapp`.
- A sessão pareada de cada usuário fica em `.baileys-auth/<userId>/` (em disco, **não versionado**). Perder essa pasta invalida a sessão daquele usuário e exige reconectar pelo dashboard.
- Dedupe de mensagens é feito pelo índice único `whatsappMessageId` no banco — reenvios do Baileys ao reconectar não duplicam lançamentos.
- Cada conexão reconecta sozinha em quedas transitórias, exceto quando a sessão é invalidada (`loggedOut`) — nesse caso o usuário precisa clicar em "Reconectar" no dashboard e escanear o QR de novo.
- **Só pode haver uma instância do worker (`npm run whatsapp`) rodando por vez** — duas escrevendo na mesma pasta `.baileys-auth/<userId>/` corrompem a sessão.

## Autenticação

Login por email+senha, implementado na mão (sem NextAuth/Auth.js): JWT assinado com `jose` guardado em cookie httpOnly (~30 dias), senha com `bcryptjs`. Essa escolha não é modismo — este Next.js (v16) renomeou `middleware.ts` para **`proxy.ts`** (`src/proxy.ts`), uma convenção nova que bibliotecas de auth de terceiros não necessariamente suportam ainda; os próprios docs desta versão do Next trazem esse padrão (JWT + cookie + DAL) como referência oficial pra esse caso.

- `/signup` cria uma conta; se não vier de um link de convite, cria também um household novo.
- `/settings/household` gera um link de convite (`/invite/<token>`, expira em 7 dias ou no primeiro uso) pra outra pessoa entrar no **mesmo** household.
- `/settings/whatsapp` conecta o WhatsApp da conta logada (QR exibido na tela, não no terminal).
- Autorização real (não só redirecionamento de UX) é sempre checada no server — toda rota de API e query são escopadas por `householdId` da sessão.

## Requisitos

- Node.js 20+
- Docker (para o Postgres local) ou uma instância Postgres acessível
- Um número de WhatsApp por pessoa que for lançar gastos (cada um pareia o próprio, como "dispositivo conectado")

## Configuração

Copie `.env.example` para `.env` e ajuste se necessário:

```bash
cp .env.example .env
```

| Variável | Descrição | Default |
|---|---|---|
| `DATABASE_URL` | Connection string do Postgres | `postgresql://findev:findev@localhost:5432/financeiro?schema=public` |
| `WHATSAPP_AUTH_DIR` | Pasta onde o Baileys guarda as sessões pareadas (uma subpasta por usuário) | `.baileys-auth` |
| `WHATSAPP_LOG_LEVEL` | Nível de log do worker (`fatal\|error\|warn\|info\|debug\|trace\|silent`) | `info` |
| `SESSION_SECRET` | Chave usada pra assinar o cookie de sessão (JWT). Gere com `openssl rand -base64 32` | — |

## Rodando em desenvolvimento

```bash
docker compose up -d        # sobe o Postgres local (findev/findev, db financeiro)
npx prisma migrate dev      # aplica as migrations
npm run dev                 # Next.js em http://localhost:3000
npm run whatsapp             # worker do WhatsApp, em outro terminal
```

Fluxo inicial: `/signup` (cria sua conta + household) → opcionalmente `/settings/household` pra convidar mais alguém → `/settings/whatsapp` pra parear seu WhatsApp (QR aparece na tela) → mande uma mensagem no chat "Mensagens para você mesmo".

## Scripts úteis

```bash
npm run lint                # ESLint
npm test                    # Vitest
npm run parse:test          # testa o parser isoladamente (scripts/parse-and-save.ts)
```

## Estado atual: pronto para dev, **não pronto para produção**

O que falta antes de expor isso para produção:

### Deploy / infraestrutura
- [ ] Não existe Dockerfile nem pipeline de deploy para o app Next.js nem para o worker.
- [ ] O worker **não pode rodar em serverless** (Vercel etc.) — é um processo de longa duração com estado em disco (`.baileys-auth/<userId>/`, uma pasta por usuário pareado). Precisa de um host com processo persistente (VPS, container com volume persistente, Fly.io/Railway com storage, etc.).
- [ ] Definir onde o Postgres de produção vai rodar (hoje só existe o `docker-compose.yml` de dev) e configurar backups automáticos.
- [ ] `.baileys-auth/` precisa de backup/estratégia de restauração — perder a pasta de um usuário em produção significa ele reconectar pelo dashboard e reescanear o QR.
- [ ] Sem supervisor de processo (systemd, pm2, container restart policy) para reiniciar o worker se ele cair de vez (crash fora do fluxo de reconexão do Baileys).
- [ ] Rodar `prisma migrate deploy` (não `migrate dev`) no pipeline de produção.

### Segurança
- [ ] `SESSION_SECRET` e `DATABASE_URL` hoje só existem em `.env` local — definir como serão injetados em produção (secret manager, variáveis de ambiente do host, etc.), nunca commitados.
- [ ] Sem rate limiting em `/login`, `/signup` nem nas rotas da API — aceitável na escala atual (household pequeno), mas revisar antes de abrir cadastro público.
- [ ] Sem fluxo de recuperação de senha (esqueci minha senha).
- [ ] Sem verificação de email no cadastro.
- [ ] Sessão é um JWT stateless: deslogar apaga o cookie, mas não existe revogação server-side de um token já emitido. Aceitável na escala atual; revisar se algum dia for preciso "encerrar sessão em todos os dispositivos".

### Observabilidade
- [ ] Logs do worker (Pino) e do Next.js só vão para stdout — sem agregação/alerta configurados. Definir para onde os logs vão em produção e alertar em caso de queda do worker ou de erro de parsing recorrente.
- [ ] Sem health check para o worker (nenhum endpoint/sinal externo indica se ele está conectado ao WhatsApp ou "preso" reconectando, além de olhar a tabela `WhatsAppAccount`).

### Produto
- [ ] Manter este README atualizado conforme o projeto evoluir.
