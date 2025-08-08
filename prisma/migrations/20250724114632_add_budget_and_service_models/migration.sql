/*
  Warnings:

  - Added the required column `userId` to the `CommunicationLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "convidados" INTEGER,
ADD COLUMN     "desconto" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "eventDate" TIMESTAMP(3),
ADD COLUMN     "eventName" TEXT,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "taxaServico" DOUBLE PRECISION DEFAULT 10;

-- AlterTable
ALTER TABLE "BudgetItem" ADD COLUMN     "unidade" TEXT;

-- AlterTable
ALTER TABLE "CommunicationLog" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidade" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_nome_key" ON "Service"("nome");

-- AddForeignKey
ALTER TABLE "CommunicationLog" ADD CONSTRAINT "CommunicationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
