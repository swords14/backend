/*
  Warnings:

  - A unique constraint covering the columns `[codigoOrcamento]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "codigoOrcamento" TEXT,
ADD COLUMN     "condicoesPagamento" TEXT,
ADD COLUMN     "dataEnvio" TIMESTAMP(3),
ADD COLUMN     "horarioFim" TEXT,
ADD COLUMN     "horarioInicio" TEXT,
ADD COLUMN     "localEventoCEP" TEXT,
ADD COLUMN     "localEventoCidade" TEXT,
ADD COLUMN     "localEventoEndereco" TEXT,
ADD COLUMN     "localEventoEstado" TEXT,
ADD COLUMN     "localEventoNome" TEXT,
ADD COLUMN     "observacoesFinanceiras" TEXT,
ADD COLUMN     "restricoesAlimentares" TEXT,
ADD COLUMN     "tipoCozinha" TEXT,
ADD COLUMN     "versao" TEXT DEFAULT '1.0';

-- CreateIndex
CREATE UNIQUE INDEX "Budget_codigoOrcamento_key" ON "Budget"("codigoOrcamento");
