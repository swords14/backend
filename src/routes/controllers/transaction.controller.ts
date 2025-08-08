// Caminho do arquivo: backend/src/controllers/transaction.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../controllers/audit.service';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
    user?: { id: number; role: string };
}

// Obter categorias de transação de forma dinâmica
export const getTransactionCategories = async (_req: Request, res: Response) => {
    const categoriasReceita = ['Eventos', 'Consultoria', 'Outras'];
    const categoriasDespesa = ['Fornecedores', 'Fixas', 'Marketing', 'Impostos', 'Outras'];
    res.status(200).json({ receitas: categoriasReceita, despesas: categoriasDespesa });
};

// Listar todas as transações com filtros
export const getTransactions = async (req: Request, res: Response) => {
    const { dataInicio, dataFim, categoria, status } = req.query;
    const whereClause: any = {};

    if (dataInicio) {
        whereClause.data = { gte: new Date(dataInicio as string) };
    }
    if (dataFim) {
        whereClause.data = { ...whereClause.data, lte: new Date(dataFim as string) };
    }
    if (categoria && categoria !== 'todas') {
        whereClause.categoria = categoria;
    }
    if (status && status !== 'todos') {
        whereClause.status = status;
    }

    try {
        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                client: { select: { nome: true } },
                supplier: { select: { nome: true } },
                event: { select: { title: true } }
            },
            orderBy: { data: 'desc' }
        });
        res.status(200).json(transactions);
    } catch (error: any) {
        res.status(500).json({ message: 'Erro ao buscar transações.', error: error.message });
    }
};

// Criar uma nova transação
export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
    const { descricao, valor, tipo, data, status, metodoPagamento, categoria, dataVencimento, clientId, supplierId, eventId, observacoes, linkComprovante, numeroDocumento } = req.body;
    try {
        const newTransaction = await prisma.transaction.create({
            data: {
                descricao, valor, tipo, status, metodoPagamento, categoria,
                data: new Date(data),
                dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
                clientId: clientId ? Number(clientId) : null,
                supplierId: supplierId ? Number(supplierId) : null,
                eventId,
                observacoes, linkComprovante, numeroDocumento
            }
        });
        if (req.user) {
            await createAuditLog({
                action: 'CREATE',
                entityType: 'Transaction',
                entityId: newTransaction.id,
                userId: Number(req.user.id),
                details: { descricao: newTransaction.descricao, valor: newTransaction.valor, tipo: newTransaction.tipo }
            });
        }
        res.status(201).json(newTransaction);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao criar transação.", error: error.message });
    }
};

// Atualizar uma transação
export const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { clientId, supplierId, eventId, ...dataToUpdate } = req.body;
    try {
        const transactionBeforeUpdate = await prisma.transaction.findUnique({ where: { id } });
        if (!transactionBeforeUpdate) {
            return res.status(404).json({ message: "Transação não encontrada." });
        }
        const updatedTransaction = await prisma.transaction.update({
            where: { id },
            data: { 
                ...dataToUpdate,
                data: dataToUpdate.data ? new Date(dataToUpdate.data) : undefined, 
                dataVencimento: dataToUpdate.dataVencimento ? new Date(dataToUpdate.dataVencimento) : null,
                clientId: clientId ? Number(clientId) : null,
                supplierId: supplierId ? Number(supplierId) : null,
                eventId: eventId || null
            },
        });
        if (req.user) {
            await createAuditLog({
                action: 'UPDATE',
                entityType: 'Transaction',
                entityId: id,
                userId: Number(req.user.id),
                details: { 
                    before: { descricao: transactionBeforeUpdate.descricao, valor: transactionBeforeUpdate.valor, status: transactionBeforeUpdate.status },
                    after: { descricao: updatedTransaction.descricao, valor: updatedTransaction.valor, status: updatedTransaction.status }
                }
            });
        }
        res.status(200).json(updatedTransaction);
    } catch (error: any) {
        res.status(500).json({ message: 'Erro ao atualizar transação.', error: error.message });
    }
};

// Atualizar apenas o status de uma transação
export const updateTransactionStatus = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const transactionBeforeUpdate = await prisma.transaction.findUnique({ where: { id } });
        if (!transactionBeforeUpdate) {
            return res.status(404).json({ message: "Transação não encontrada." });
        }
        const updatedTransaction = await prisma.transaction.update({
            where: { id },
            data: { 
                status: status,
                data: status === 'Efetivado' && !transactionBeforeUpdate.data ? new Date() : transactionBeforeUpdate.data,
                dataVencimento: status === 'Efetivado' ? null : transactionBeforeUpdate.dataVencimento,
            },
        });
        if (req.user) {
            await createAuditLog({
                action: 'UPDATE_STATUS',
                entityType: 'Transaction',
                entityId: id,
                userId: Number(req.user.id),
                details: { 
                    descricao: updatedTransaction.descricao, 
                    valor: updatedTransaction.valor, 
                    status_before: transactionBeforeUpdate.status, 
                    status_after: updatedTransaction.status 
                }
            });
        }
        res.status(200).json(updatedTransaction);
    } catch (error: any) {
        res.status(500).json({ message: 'Erro ao atualizar status da transação.', error: error.message });
    }
};


// Apagar uma transação
export const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    try {
        const transactionToDelete = await prisma.transaction.findUnique({ where: { id } });
        if (!transactionToDelete) {
            return res.status(404).json({ message: "Transação não encontrada." });
        }
        await prisma.transaction.delete({ where: { id } });
        if (req.user) {
            await createAuditLog({
                action: 'DELETE',
                entityType: 'Transaction',
                entityId: id,
                userId: Number(req.user.id),
                details: { descricao: transactionToDelete.descricao, valor: transactionToDelete.valor, tipo: transactionToDelete.tipo }
            });
        }
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: 'Erro ao apagar transação.', error: error.message });
    }
};