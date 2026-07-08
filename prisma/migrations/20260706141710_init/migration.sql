-- CreateEnum
CREATE TYPE "Tipo" AS ENUM ('despesa', 'receita');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "tipo" "Tipo" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "data" DATE NOT NULL,
    "mensagemOriginal" TEXT,
    "remetente" TEXT,
    "whatsappMessageId" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'whatsapp',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_whatsappMessageId_key" ON "Transaction"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "Transaction_data_tipo_idx" ON "Transaction"("data", "tipo");

-- CreateIndex
CREATE INDEX "Transaction_categoria_idx" ON "Transaction"("categoria");
