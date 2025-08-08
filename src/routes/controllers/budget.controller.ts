// Caminho do arquivo: backend/src/controllers/budget.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { createAuditLog } from './audit.service';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
    user?: { id: number; role: string };
}

// Obter todos os orçamentos (com filtros e paginação)
export const getBudgets = async (req: Request, res: Response) => {
    try {
        // Implementar a lógica de busca com paginação e filtros se necessário
        const budgets = await prisma.budget.findMany({
            include: {
                client: { select: { id: true, nome: true } },
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(budgets);
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao buscar orçamentos.", error: error.message });
    }
};

// Obter um orçamento por ID
export const getBudgetById = async (req: Request, res: Response) => {
    const { budgetId } = req.params;
    try {
        const budget = await prisma.budget.findUnique({
            where: { id: budgetId },
            include: {
                client: true,
                items: true
            }
        });
        if (!budget) return res.status(404).json({ message: "Orçamento não encontrado." });
        return res.status(200).json(budget);
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao buscar orçamento.", error: error.message });
    }
};

// Criar um novo orçamento
export const createBudget = async (req: AuthenticatedRequest, res: Response) => {
    const { clienteId, items, ...budgetData } = req.body;
    try {
        const newBudget = await prisma.budget.create({
            data: {
                ...budgetData,
                clientId: clienteId,
                validade: new Date(budgetData.validade),
                eventDate: budgetData.eventDate ? new Date(budgetData.eventDate) : null,
                items: {
                    createMany: {
                        data: items
                    }
                }
            }
        });
        await createAuditLog({
            action: 'CREATE',
            entityType: 'Budget',
            entityId: newBudget.id,
            userId: req.user!.id,
            details: { codigo: newBudget.codigoOrcamento, clientId: newBudget.clientId }
        });
        return res.status(201).json(newBudget);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Já existe um orçamento com este código." });
        }
        return res.status(500).json({ message: "Erro ao criar orçamento.", error: error.message });
    }
};

// Atualizar um orçamento
export const updateBudget = async (req: AuthenticatedRequest, res: Response) => {
    const { budgetId } = req.params;
    const { items, ...budgetData } = req.body;
    try {
        const updatedBudget = await prisma.$transaction(async (tx) => {
            const budget = await tx.budget.update({
                where: { id: budgetId },
                data: {
                    ...budgetData,
                    validade: new Date(budgetData.validade),
                    eventDate: budgetData.eventDate ? new Date(budgetData.eventDate) : null,
                }
            });
            await tx.budgetItem.deleteMany({ where: { budgetId: budget.id } });
            if (items && items.length > 0) {
                await tx.budgetItem.createMany({
                    data: items.map((item: any) => ({ ...item, budgetId: budget.id }))
                });
            }
            return budget;
        });
        await createAuditLog({
            action: 'UPDATE',
            entityType: 'Budget',
            entityId: updatedBudget.id,
            userId: req.user!.id,
            details: { codigo: updatedBudget.codigoOrcamento }
        });
        return res.status(200).json(updatedBudget);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Já existe um orçamento com este código." });
        }
        return res.status(500).json({ message: "Erro ao atualizar orçamento.", error: error.message });
    }
};

// Excluir um orçamento
export const deleteBudget = async (req: AuthenticatedRequest, res: Response) => {
    const { budgetId } = req.params;
    try {
        await prisma.budget.delete({ where: { id: budgetId } });
        return res.status(204).send();
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao excluir orçamento.", error: error.message });
    }
};

// Ação rápida para atualizar o status do orçamento
export const updateBudgetStatus = async (req: AuthenticatedRequest, res: Response) => {
    const { budgetId } = req.params;
    const { status } = req.body;
    try {
        const updatedBudget = await prisma.budget.update({
            where: { id: budgetId },
            data: { status }
        });
        await createAuditLog({
            action: 'UPDATE_STATUS',
            entityType: 'Budget',
            entityId: updatedBudget.id,
            userId: req.user!.id,
            details: { status: updatedBudget.status }
        });
        return res.status(200).json(updatedBudget);
    } catch (error: any) {
        return res.status(500).json({ message: "Erro ao atualizar status do orçamento.", error: error.message });
    }
};