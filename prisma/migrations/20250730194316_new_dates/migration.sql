/*
  Warnings:

  - You are about to drop the column `cargoContatoPrincipal` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `contatoSecundarioEmail` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `contatoSecundarioNome` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `contatoSecundarioTelefone` on the `Client` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cpf]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnpj]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "cargoContatoPrincipal",
DROP COLUMN "contatoSecundarioEmail",
DROP COLUMN "contatoSecundarioNome",
DROP COLUMN "contatoSecundarioTelefone",
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'Lead';

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_cpf_key" ON "Client"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Client_cnpj_key" ON "Client"("cnpj");

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
