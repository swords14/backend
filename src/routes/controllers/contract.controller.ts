// Caminho: backend/src/controllers/contract.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from './audit.service';

const prisma = new PrismaClient();

// --- FUNÇÃO AUXILIAR PARA CRIAR EVENTO ---
// Esta função será chamada quando um contrato for assinado.
const createEventFromContract = async (contractId: string, userId: number) => {
    const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { budget: { include: { items: true, client: true } } }
    });

    if (!contract || !contract.budget) {
        throw new Error('Contrato ou Orçamento associado não encontrado.');
    }

    const budget = contract.budget;

    const newEvent = await prisma.event.create({
        data: {
            title: budget.eventName || `Evento para ${budget.client.nome}`,
            startDate: budget.eventDate || new Date(),
            endDate: budget.eventDate ? new Date(new Date(budget.eventDate).setHours(new Date(budget.eventDate).getHours() + 4)) : null,
            convidados: budget.convidados || 0,
            valorTotal: budget.valorTotal,
            status: 'Planejado',
            observacoes: budget.observacoes,
            clientId: budget.clientId,
            eventType: budget.tipoCozinha,
            localNome: budget.localEventoNome,
            localEndereco: budget.localEventoEndereco,
            // Mapeie outros campos do orçamento para o evento conforme necessário...
        },
    });

    // Atualiza o contrato com o ID do evento recém-criado
    await prisma.contract.update({
        where: { id: contractId },
        data: { eventId: newEvent.id },
    });

    // Log de auditoria para a criação do evento a partir do contrato
    await createAuditLog({
        action: 'CREATE_FROM_CONTRACT',
        entityType: 'Event',
        entityId: newEvent.id,
        userId: userId,
        details: { sourceContractId: contractId }
    });

    return newEvent;
};


// --- FUNÇÕES DO CONTROLADOR ---

// Lista todos os contratos
export const getAllContracts = async (req: Request, res: Response) => {
    try {
        const contracts = await prisma.contract.findMany({
            orderBy: { dataEmissao: 'desc' },
            include: { client: { select: { nome: true } } }
        });
        res.status(200).json(contracts);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao buscar contratos.", error: error.message });
    }
};

// Busca um contrato por ID
export const getContractById = async (req: Request, res: Response) => {
    try {
        const contract = await prisma.contract.findUnique({
            where: { id: req.params.id },
            include: { client: true, budget: true, event: true }
        });
        if (!contract) return res.status(404).json({ message: "Contrato não encontrado." });
        res.status(200).json(contract);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao buscar contrato.", error: error.message });
    }
};

// ** NOVO CONTROLADOR: Cria um contrato com conteúdo personalizável **
export const createContract = async (req: Request, res: Response) => {
    const { budgetId, conteudo } = req.body;
    if (!budgetId || !conteudo) {
        return res.status(400).json({ message: "ID do Orçamento e conteúdo do contrato são obrigatórios." });
    }

    try {
        const budget = await prisma.budget.findUnique({ where: { id: budgetId }, include: { client: true } });
        if (!budget) {
            return res.status(404).json({ message: "Orçamento não encontrado." });
        }

        // Verifica se o orçamento já tem um contrato
        const existingContract = await prisma.contract.findUnique({ where: { budgetId } });
        if (existingContract) {
            return res.status(409).json({ message: "Já existe um contrato para este orçamento." });
        }

        // Gera um código de contrato único (ex: CTR-001, CTR-002)
        const lastContract = await prisma.contract.findFirst({ orderBy: { createdAt: 'desc' } });
        let nextIdNumber = 1;
        if (lastContract) {
            const lastIdNumber = parseInt(lastContract.codigoContrato.split('-')[1]);
            nextIdNumber = lastIdNumber + 1;
        }
        const newCodigoContrato = `CTR-${String(nextIdNumber).padStart(3, '0')}`;

        const newContract = await prisma.contract.create({
            data: {
                codigoContrato: newCodigoContrato,
                status: "Aguardando Assinatura",
                valor: budget.valorTotal,
                clientId: budget.clientId,
                budgetId: budget.id,
                conteudo: conteudo, // Salva o conteúdo personalizável
            },
            include: { client: true }
        });

        await createAuditLog({
            action: 'CREATE_WITH_CUSTOM_CONTENT',
            entityType: 'Contract',
            entityId: newContract.id,
            userId: req.user!.id,
            details: { sourceBudgetId: budgetId, client: newContract.client.nome }
        });

        res.status(201).json(newContract);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao criar contrato.", error: error.message });
    }
};

// ** GATILHO 1: Cria um contrato a partir de um orçamento aprovado no funil **
export const createContractFromBudget = async (req: Request, res: Response) => {
    const { budgetId } = req.body;
    if (!budgetId) return res.status(400).json({ message: "ID do Orçamento é obrigatório." });

    try {
        const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
        if (!budget) return res.status(404).json({ message: "Orçamento não encontrado." });

        // Gera um código de contrato único (ex: CTR-001, CTR-002)
        const lastContract = await prisma.contract.findFirst({ orderBy: { createdAt: 'desc' } });
        let nextIdNumber = 1;
        if (lastContract) {
            const lastIdNumber = parseInt(lastContract.codigoContrato.split('-')[1]);
            nextIdNumber = lastIdNumber + 1;
        }
        const newCodigoContrato = `CTR-${String(nextIdNumber).padStart(3, '0')}`;

        const newContract = await prisma.contract.create({
            data: {
                codigoContrato: newCodigoContrato,
                status: "Aguardando Assinatura",
                valor: budget.valorTotal,
                clientId: budget.clientId,
                budgetId: budget.id,
            },
            include: { client: true }
        });

        await createAuditLog({
            action: 'CREATE_FROM_BUDGET',
            entityType: 'Contract',
            entityId: newContract.id,
            userId: req.user!.id,
            details: { sourceBudgetId: budgetId, client: newContract.client.nome }
        });

        res.status(201).json(newContract);
    } catch (error: any) {
        if (error.code === 'P2002') { // Erro de constraint única (budgetId)
            return res.status(409).json({ message: "Já existe um contrato para este orçamento." });
        }
        res.status(500).json({ message: "Erro ao criar contrato a partir do orçamento.", error: error.message });
    }
};

// ** NOVO CONTROLADOR: Atualiza o conteúdo de um contrato existente **
export const updateContract = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { conteudo } = req.body;

    if (!conteudo) {
        return res.status(400).json({ message: "O conteúdo do contrato é obrigatório para atualização." });
    }

    try {
        const existingContract = await prisma.contract.findUnique({ where: { id } });
        if (!existingContract) {
            return res.status(404).json({ message: "Contrato não encontrado." });
        }

        const updatedContract = await prisma.contract.update({
            where: { id },
            data: { conteudo },
        });
        
        await createAuditLog({
            action: 'UPDATE_CONTENT',
            entityType: 'Contract',
            entityId: updatedContract.id,
            userId: req.user!.id,
            details: { message: "Conteúdo do contrato atualizado." }
        });

        res.status(200).json(updatedContract);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao atualizar contrato.", error: error.message });
    }
};


// ** GATILHO 2: Atualiza o status do contrato e cria um evento se for "Assinado" **
export const updateContractStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ message: "Status é obrigatório." });

    try {
        const contractBeforeUpdate = await prisma.contract.findUnique({ where: { id } });
        if (!contractBeforeUpdate) return res.status(404).json({ message: "Contrato não encontrado." });

        const updatedContract = await prisma.contract.update({
            where: { id },
            data: { 
                status: status,
                // Se o status for "Assinado", define a data de assinatura
                dataAssinatura: status === 'Assinado' ? new Date() : contractBeforeUpdate.dataAssinatura,
            },
        });

        // O GATILHO PRINCIPAL!
        if (status === 'Assinado' && !contractBeforeUpdate.eventId) {
            await createEventFromContract(id, req.user!.id);
        }

        await createAuditLog({
            action: 'UPDATE_STATUS',
            entityType: 'Contract',
            entityId: id,
            userId: req.user!.id,
            details: { from: contractBeforeUpdate.status, to: status }
        });

        res.status(200).json(updatedContract);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao atualizar status do contrato.", error: error.message });
    }
};

// Exclui um contrato
export const deleteContract = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const contract = await prisma.contract.findUnique({ where: { id } });
        if (!contract) return res.status(404).json({ message: "Contrato não encontrado." });
        
        // Regra de negócio: não permitir exclusão se já estiver assinado ou tiver evento
        if (contract.status === 'Assinado' || contract.eventId) {
            return res.status(403).json({ message: "Não é possível excluir um contrato assinado ou que já gerou um evento." });
        }

        await prisma.contract.delete({ where: { id } });

        await createAuditLog({
            action: 'DELETE',
            entityType: 'Contract',
            entityId: id,
            userId: req.user!.id,
            details: { codigo: contract.codigoContrato, clientId: contract.clientId }
        });

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao excluir contrato.", error: error.message });
    }
};