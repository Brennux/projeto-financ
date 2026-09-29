# Imagem do worker do WhatsApp (Fly.io) -- o app Next.js roda na Vercel, nao
# aqui. node:20-slim (Debian) em vez de alpine porque uma dependencia do
# baileys (libsignal) pode precisar compilar binario nativo, e prebuilds
# costumam mirar glibc, nao musl.
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate

CMD ["npx", "tsx", "src/worker/whatsapp-worker.ts"]
