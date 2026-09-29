-- DropForeignKey
ALTER TABLE "WhatsAppAccount" DROP CONSTRAINT "WhatsAppAccount_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "whatsAppJid" TEXT,
ADD COLUMN     "whatsAppJidAlt" TEXT,
ADD COLUMN     "whatsAppLinkedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "WhatsAppAccount";

-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "status" "WhatsAppStatus" NOT NULL DEFAULT 'pending',
    "qr" TEXT,
    "phoneNumber" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppLinkCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppLinkCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppLinkCode_code_key" ON "WhatsAppLinkCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppLinkCode_userId_key" ON "WhatsAppLinkCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsAppJid_key" ON "User"("whatsAppJid");

-- AddForeignKey
ALTER TABLE "WhatsAppLinkCode" ADD CONSTRAINT "WhatsAppLinkCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
