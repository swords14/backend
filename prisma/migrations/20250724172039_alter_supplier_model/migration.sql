/*
  Warnings:

  - A unique constraint covering the columns `[cnpj]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "agencia" TEXT,
ADD COLUMN     "banco" TEXT,
ADD COLUMN     "cargoContato" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "chavePix" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "conta" TEXT,
ADD COLUMN     "dataUltimoContato" TIMESTAMP(3),
ADD COLUMN     "emailAlternativo" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "inscricaoEstadual" TEXT,
ADD COLUMN     "servicosOferecidos" TEXT[],
ADD COLUMN     "telefoneAlternativo" TEXT,
ADD COLUMN     "termosPagamento" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_cnpj_key" ON "Supplier"("cnpj");
