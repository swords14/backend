/*
  Warnings:

  - A unique constraint covering the columns `[codigoContrato]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[budgetId]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `budgetId` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigoContrato` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valor` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "arquivoUrl" TEXT,
ADD COLUMN     "budgetId" TEXT NOT NULL,
ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD COLUMN     "codigoContrato" TEXT NOT NULL,
ADD COLUMN     "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "valor" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Contract_codigoContrato_key" ON "Contract"("codigoContrato");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_budgetId_key" ON "Contract"("budgetId");

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
