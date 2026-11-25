-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "cartaoId" TEXT,
ADD COLUMN     "dataCompra" DATE,
ADD COLUMN     "parcelaNumero" INTEGER,
ADD COLUMN     "parcelaTotal" INTEGER,
ADD COLUMN     "parcelamentoId" TEXT;

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "limite" DECIMAL(10,2),
    "diaFechamento" INTEGER NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaturaPaga" (
    "id" TEXT NOT NULL,
    "cartaoId" TEXT NOT NULL,
    "mes" DATE NOT NULL,
    "pagaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "FaturaPaga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditCard_householdId_nome_key" ON "CreditCard"("householdId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "FaturaPaga_cartaoId_mes_key" ON "FaturaPaga"("cartaoId", "mes");

-- CreateIndex
CREATE INDEX "Transaction_cartaoId_data_idx" ON "Transaction"("cartaoId", "data");

-- CreateIndex
CREATE INDEX "Transaction_parcelamentoId_idx" ON "Transaction"("parcelamentoId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "CreditCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaturaPaga" ADD CONSTRAINT "FaturaPaga_cartaoId_fkey" FOREIGN KEY ("cartaoId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

