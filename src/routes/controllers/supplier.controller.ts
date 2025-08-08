// Caminho do arquivo: backend/src/controllers/supplier.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../controllers/audit.service';

const prisma = new PrismaClient();

// Obter categorias de fornecedor de forma dinâmica
export const getSupplierCategories = async (req: Request, res: Response) => {
    const categorias = ['Decoração', 'Música/Som', 'Fotografia', 'Buffet/Doces', 'Mobiliário', 'Iluminação', 'Segurança', 'Outros'];
    res.status(200).json(categorias);
};

// Listar todos os fornecedores com filtros
export const getSuppliers = async (req: Request, res: Response) => {
  const { termoBusca, categoria, status, sortOrder } = req.query;

  const whereClause: any = {};
  if (termoBusca) {
      whereClause.OR = [
          { nome: { contains: termoBusca as string, mode: 'insensitive' } },
          { contato: { contains: termoBusca as string, mode: 'insensitive' } },
          { email: { contains: termoBusca as string, mode: 'insensitive' } },
      ];
  }
  if (categoria && categoria !== 'todas') {
      whereClause.categoria = categoria;
  }
  if (status && status !== 'todos') {
      whereClause.status = status;
  }

  const orderByClause: any = {};
  switch (sortOrder) {
      case 'nome_desc':
          orderByClause.nome = 'desc';
          break;
      case 'rating_asc':
          orderByClause.rating = 'asc';
          break;
      case 'rating_desc':
          orderByClause.rating = 'desc';
          break;
      case 'nome_asc':
      default:
          orderByClause.nome = 'asc';
          break;
  }

  try {
    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      orderBy: orderByClause
    });
    res.status(200).json(suppliers);
  } catch (error: any) {
    console.error("Erro ao buscar fornecedores:", error);
    res.status(500).json({ message: 'Erro ao buscar fornecedores.', error: error.message });
  }
};

// Criar um novo fornecedor
export const createSupplier = async (req: Request, res: Response) => {
  const { 
    nome, categoria, contato, cargoContato, telefone, telefoneAlternativo,
    email, emailAlternativo, cnpj, inscricaoEstadual,
    endereco, cidade, estado, cep,
    termosPagamento, banco, agencia, conta, chavePix,
    servicosOferecidos, dataUltimoContato,
    rating, status, notas 
  } = req.body;

  try {
    const newSupplier = await prisma.supplier.create({
      data: { 
        nome, categoria, contato, 
        cargoContato,
        telefone, 
        telefoneAlternativo,
        email, 
        emailAlternativo,
        cnpj,
        inscricaoEstadual,
        endereco,
        cidade,
        estado,
        cep,
        termosPagamento,
        banco,
        agencia,
        conta,
        chavePix,
        servicosOferecidos: servicosOferecidos || [],
        dataUltimoContato: dataUltimoContato ? new Date(dataUltimoContato) : null,
        rating: Number(rating),
        status, 
        notas: notas 
      },
    });

    if (req.user) {
        await createAuditLog({
            action: 'CREATE',
            entityType: 'Supplier',
            entityId: newSupplier.id.toString(),
            userId: Number(req.user.id),
            details: { nome: newSupplier.nome, categoria: newSupplier.categoria, cnpj: newSupplier.cnpj }
        });
    }

    res.status(201).json(newSupplier);
  } catch (error: any) {
    console.error("Erro ao criar fornecedor:", error);
    if (error.code === 'P2002' && error.meta?.target?.includes('cnpj')) {
        return res.status(409).json({ message: 'CNPJ já cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao criar fornecedor.', error: error.message });
  }
};

// Atualizar um fornecedor
export const updateSupplier = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { 
        nome, categoria, contato, cargoContato, telefone, telefoneAlternativo,
        email, emailAlternativo, cnpj, inscricaoEstadual,
        endereco, cidade, estado, cep,
        termosPagamento, banco, agencia, conta, chavePix,
        servicosOferecidos, dataUltimoContato,
        rating, status, notas 
    } = req.body;

    try {
        const supplierId = Number(id);
        const supplierBeforeUpdate = await prisma.supplier.findUnique({ where: { id: supplierId } });

        if (!supplierBeforeUpdate) {
            return res.status(404).json({ message: 'Fornecedor não encontrado.' });
        }

        const updatedSupplier = await prisma.supplier.update({
            where: { id: supplierId },
            data: {
                nome, categoria, contato,
                cargoContato,
                telefone,
                telefoneAlternativo,
                email,
                emailAlternativo,
                cnpj,
                inscricaoEstadual,
                endereco,
                cidade,
                estado,
                cep,
                termosPagamento,
                banco,
                agencia,
                conta,
                chavePix,
                servicosOferecidos: servicosOferecidos || [],
                dataUltimoContato: dataUltimoContato ? new Date(dataUltimoContato) : null,
                rating: Number(rating),
                status,
                notas
            },
        });

        if (req.user) {
            await createAuditLog({
                action: 'UPDATE',
                entityType: 'Supplier',
                entityId: updatedSupplier.id.toString(),
                userId: Number(req.user.id),
                details: { 
                    before: { nome: supplierBeforeUpdate.nome, cnpj: supplierBeforeUpdate.cnpj, status: supplierBeforeUpdate.status }, 
                    after: { nome: updatedSupplier.nome, cnpj: updatedSupplier.cnpj, status: updatedSupplier.status } 
                }
            });
        }

        res.status(200).json(updatedSupplier);
    } catch (error: any) {
        console.error("Erro ao atualizar fornecedor:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('cnpj')) {
            return res.status(409).json({ message: 'CNPJ já cadastrado.' });
        }
        res.status(500).json({ message: 'Erro ao atualizar fornecedor.', error: error.message });
    }
};

// Apagar um fornecedor
export const deleteSupplier = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const supplierId = Number(id);
        const supplierToDelete = await prisma.supplier.findUnique({ where: { id: supplierId } });
        if (!supplierToDelete) {
            return res.status(404).json({ message: 'Fornecedor não encontrado.' });
        }

        const hasTransactions = await prisma.transaction.count({ where: { supplierId: supplierId } });
        const hasInventoryItems = await prisma.inventoryItem.count({ where: { supplierId: supplierId } });

        if (hasTransactions > 0 || hasInventoryItems > 0) {
          return res.status(400).json({ message: 'Não é possível excluir fornecedor com transações ou itens de inventário vinculados. Remova-os primeiro.' });
        }

        await prisma.supplier.delete({ where: { id: supplierId } });

        if (req.user) {
            await createAuditLog({
                action: 'DELETE',
                entityType: 'Supplier',
                entityId: id,
                userId: Number(req.user.id),
                details: { nome: supplierToDelete.nome, categoria: supplierToDelete.categoria, cnpj: supplierToDelete.cnpj }
            });
        }

        res.status(204).send();
    } catch (error: any) {
        console.error("Erro ao apagar fornecedor:", error);
        res.status(500).json({ message: 'Erro ao apagar fornecedor.', error: error.message });
    }
};