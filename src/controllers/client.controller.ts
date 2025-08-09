// Caminho: backend/src/controllers/client.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { createAuditLog } from './audit.service';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: { id: number; role: string };
}

// Listar todos os clientes
export const getClients = async (_req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        contacts: {
          orderBy: { isPrincipal: 'desc' } // Inclui contatos ordenados pelo principal primeiro
        }
      }
    });
    return res.status(200).json(clients);
  } catch (error: any) {
    console.error("Erro ao buscar clientes:", error);
    return res.status(500).json({ message: 'Erro ao buscar clientes.', error: error.message });
  }
};

// Obter cliente por ID
export const getClientById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });

  try {
    const client = await prisma.client.findUnique({ 
        where: { id },
        include: { contacts: true }
    });
    if (!client) return res.status(404).json({ message: 'Cliente não encontrado.' });

    return res.status(200).json(client);
  } catch (error: any) {
    console.error("Erro ao buscar cliente:", error);
    return res.status(500).json({ message: 'Erro ao buscar cliente.', error: error.message });
  }
};

// Criar um novo cliente com todos os contatos
export const createClient = async (req: AuthenticatedRequest, res: Response) => {
    const { 
        nome, email, telefone, tipo, cnpj, cpf, endereco, cidade, notas, tags, status,
        inscricaoEstadual, ramoAtividade, cep, estado, preferenciasEvento, origemCliente,
        dataAniversario, dataFundacaoEmpresa, contacts // Recebe agora um array de contatos
    } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ message: "Nome e email são obrigatórios." });
    }

    try {
        const newClient = await prisma.client.create({
            data: {
                nome, email, telefone, tipo, cnpj, cpf, endereco, cidade, notas, tags, status,
                inscricaoEstadual, ramoAtividade, cep, estado,
                preferenciasEvento, origemCliente,
                dataAniversario: dataAniversario ? new Date(dataAniversario) : null,
                dataFundacaoEmpresa: dataFundacaoEmpresa ? new Date(dataFundacaoEmpresa) : null,
                // LÓGICA CORRIGIDA: Cria todos os contatos (principal e secundários)
                contacts: {
                    createMany: {
                        data: contacts.map((contact: any) => ({
                            nome: contact.nome,
                            email: contact.email,
                            telefone: contact.telefone,
                            cargo: contact.cargo,
                            isPrincipal: contact.isPrincipal
                        }))
                    }
                }
            },
            include: { contacts: true }
        });
        
        if (req.user) {
            await createAuditLog({
                action: 'CREATE',
                entityType: 'Client',
                entityId: newClient.id.toString(),
                userId: Number(req.user.id),
                details: { nome: newClient.nome, email: newClient.email, tipo: newClient.tipo },
            });
        }

        return res.status(201).json(newClient);
    } catch (error: any) {
        console.error("Erro ao criar cliente:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = error.meta?.target;
            if (Array.isArray(target) && target.includes('email')) { 
                return res.status(409).json({ message: 'Este email já está em uso.' });
            }
            return res.status(409).json({ message: 'Conflito de dados: um campo único já existe.' });
        }
        return res.status(500).json({ message: 'Erro ao criar cliente.', error: error.message });
    }
};

// Atualizar cliente
export const updateClient = async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });

    const { 
        nome, email, telefone, tipo, cnpj, cpf, endereco, cidade, notas, tags, status,
        inscricaoEstadual, ramoAtividade, cep, estado, preferenciasEvento, origemCliente,
        dataAniversario, dataFundacaoEmpresa, contacts
    } = req.body;

    try {
        const clientBefore = await prisma.client.findUnique({ where: { id } });
        if (!clientBefore) return res.status(404).json({ message: 'Cliente não encontrado.' });

        const updatedClient = await prisma.$transaction(async (tx) => {
            // 1. Atualiza os dados principais do cliente
            const client = await tx.client.update({
                where: { id },
                data: {
                    nome, email, telefone, tipo, cnpj, cpf, endereco, cidade, notas, tags, status,
                    inscricaoEstadual, ramoAtividade, cep, estado,
                    preferenciasEvento, origemCliente,
                    dataAniversario: dataAniversario ? new Date(dataAniversario) : null,
                    dataFundacaoEmpresa: dataFundacaoEmpresa ? new Date(dataFundacaoEmpresa) : null
                } 
            });

            // 2. CORREÇÃO: Deleta e recria todos os contatos
            await tx.clientContact.deleteMany({ where: { clientId: client.id } });
            if (contacts && contacts.length > 0) {
                await tx.clientContact.createMany({
                    data: contacts.map((contact: any) => ({
                        ...contact, 
                        clientId: client.id
                    }))
                });
            }

            return client;
        });

        if (req.user) {
            await createAuditLog({
                action: 'UPDATE',
                entityType: 'Client',
                entityId: updatedClient.id.toString(),
                userId: Number(req.user.id),
                details: {
                    before: { nome: clientBefore.nome, email: clientBefore.email },
                    after: { nome: updatedClient.nome, email: updatedClient.email },
                },
            });
        }

        return res.status(200).json(updatedClient);
    } catch (error: any) {
        console.error("Erro ao atualizar cliente:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(409).json({ message: 'Conflito de dados: um campo único já existe.' });
        }
        return res.status(500).json({ message: 'Erro ao atualizar cliente.', error: error.message });
    }
};

// Excluir um cliente
export const deleteClient = async (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido.' });
    try {
        const client = await prisma.client.findUnique({ where: { id } });
        if (!client) return res.status(404).json({ message: 'Cliente não encontrado.' });
        
        await prisma.client.delete({ where: { id } }); // Usando onDelete: Cascade no schema
        
        if (req.user) {
            await createAuditLog({
                action: 'DELETE',
                entityType: 'Client',
                entityId: id.toString(),
                userId: Number(req.user.id),
                details: { nome: client.nome },
            });
        }
        return res.status(204).send();
    } catch (error: any) {
        console.error("Erro ao apagar cliente:", error);
        return res.status(500).json({ message: 'Erro ao apagar cliente.', error: error.message });
    }
};