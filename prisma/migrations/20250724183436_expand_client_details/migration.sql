-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "cargoContatoPrincipal" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "contatoSecundarioEmail" TEXT,
ADD COLUMN     "contatoSecundarioNome" TEXT,
ADD COLUMN     "contatoSecundarioTelefone" TEXT,
ADD COLUMN     "dataAniversario" TIMESTAMP(3),
ADD COLUMN     "dataFundacaoEmpresa" TIMESTAMP(3),
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "inscricaoEstadual" TEXT,
ADD COLUMN     "origemCliente" TEXT,
ADD COLUMN     "preferenciasEvento" TEXT,
ADD COLUMN     "ramoAtividade" TEXT;
