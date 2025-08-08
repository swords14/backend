// Caminho do arquivo: backend/src/controllers/inventory.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { createAuditLog } from '../controllers/audit.service';

const prisma = new PrismaClient();

const deleteImageFile = (imageUrl: string) => {
  if (imageUrl) {
    const imagePath = path.join(__dirname, '..', '..', imageUrl);
    fs.unlink(imagePath, (err) => {
      if (err) console.error(`Erro ao apagar a imagem ${imagePath}:`, err);
    });
  }
};

// Obter categorias de forma dinâmica
export const getInventoryCategories = async (req: Request, res: Response) => {
    const categories = ['Decoração', 'Mobiliário', 'Eletrônicos', 'Utensílios', 'Bebidas', 'Alimentos não Perecíveis', 'Material de Escritório', 'Outros'];
    res.status(200).json(categories);
};

// Nova função para uso em orçamentos
export const getAllInventoryItemsForBudget = async (req: Request, res: Response) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        nome: true,
        valorUnitario: true,
      },
      orderBy: { nome: 'asc' },
    });
    res.status(200).json(items.map(item => ({ ...item, unidade: 'unidade' })));
  } catch (error) {
    console.error("Erro ao buscar itens de inventário para orçamento:", error);
    res.status(500).json({ message: 'Erro ao buscar itens de inventário.' });
  }
};

// Listar todos os itens do estoque
export const getInventoryItems = async (req: Request, res: Response) => {
  const { termoBusca, categoria, status } = req.query;
  const whereClause: any = {};

  if (termoBusca) {
      whereClause.OR = [
          { nome: { contains: termoBusca as string, mode: 'insensitive' } },
          { sku: { contains: termoBusca as string, mode: 'insensitive' } },
      ];
  }
  if (categoria && categoria !== 'todas') {
      whereClause.categoria = categoria;
  }
  if (status && status !== 'todos') {
      // Lógica para filtrar por status
      if (status === 'Esgotado') {
          whereClause.quantidade = { lte: 0 };
      } else if (status === 'Nível Baixo') {
          whereClause.AND = [
              { quantidade: { gt: 0 } },
              { quantidade: { lte: prisma.inventoryItem.fields.estoqueMinimo } }
          ];
      } else if (status === 'Em Estoque') {
          whereClause.quantidade = { gt: prisma.inventoryItem.fields.estoqueMinimo };
      }
  }

  try {
    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      orderBy: { nome: 'asc' },
      include: { movements: { orderBy: { createdAt: 'desc' } }, supplier: true },
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar itens do estoque.', error });
  }
};

// Criar um novo item no estoque com imagem
export const createInventoryItem = async (req: Request, res: Response) => {
  const { nome, categoria, quantidade, estoqueMinimo, valorUnitario, supplierId, sku, description } = req.body;
  const imageUrl = req.file ? `uploads/${req.file.filename}` : null;
  try {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });

    const newItem = await prisma.inventoryItem.create({
      data: {
        nome, categoria, imageUrl, sku, description,
        quantidade: parseInt(quantidade, 10),
        estoqueMinimo: parseInt(estoqueMinimo, 10),
        valorUnitario: parseFloat(valorUnitario),
        supplierId: supplierId ? parseInt(supplierId, 10) : null,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entityType: 'InventoryItem',
      entityId: newItem.id.toString(),
      userId: req.user.id,
      details: { nome: newItem.nome, quantidadeInicial: newItem.quantidade }
    });

    res.status(201).json(newItem);
  } catch (error) {
    if (imageUrl) deleteImageFile(imageUrl);
    res.status(500).json({ message: 'Erro ao criar item no estoque.', error });
  }
};

// Atualizar item do estoque
export const updateInventoryItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nome, categoria, estoqueMinimo, valorUnitario, supplierId, sku, description } = req.body;
  const imageUrl = req.file ? `uploads/${req.file.filename}` : undefined;
  try {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });

    const existingItem = await prisma.inventoryItem.findUnique({ where: { id: parseInt(id, 10) } });
    if (!existingItem) {
        if (imageUrl) deleteImageFile(imageUrl);
        return res.status(404).json({ message: 'Item não encontrado.' });
    }
    if (imageUrl && existingItem.imageUrl) {
      deleteImageFile(existingItem.imageUrl);
    }

    const updatedItem = await prisma.inventoryItem.update({
      where: { id: parseInt(id, 10) },
      data: {
        nome, categoria, sku, description,
        estoqueMinimo: estoqueMinimo ? parseInt(estoqueMinimo, 10) : undefined,
        valorUnitario: valorUnitario ? parseFloat(valorUnitario) : undefined,
        supplierId: supplierId ? parseInt(supplierId, 10) : undefined,
        imageUrl,
      },
    });

    if (existingItem) {
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'InventoryItem',
        entityId: updatedItem.id,
        userId: req.user.id,
        details: { before: { nome: existingItem.nome }, after: { nome: updatedItem.nome } }
      });
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    if (imageUrl) deleteImageFile(imageUrl);
    res.status(500).json({ message: 'Erro ao atualizar item.', error });
  }
};

// Movimentação de estoque
export const addInventoryMovement = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tipo, qtd, obs } = req.body;
  try {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });

    const updatedItem = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.inventoryItem.findUnique({ where: { id: parseInt(id) } });
      if (!currentItem) throw new Error('Item não encontrado.');

      const quantidadeNumerica = parseInt(qtd, 10);
      const novaQuantidade = tipo === 'entrada' ? currentItem.quantidade + quantidadeNumerica : currentItem.quantidade - quantidadeNumerica;
      if (novaQuantidade < 0) throw new Error('Operação resultaria em estoque negativo.');

      await tx.inventoryMovement.create({ data: { tipo, quantidade: quantidadeNumerica, obs, itemId: parseInt(id) } });
      return tx.inventoryItem.update({ where: { id: parseInt(id) }, data: { quantidade: novaQuantidade } });
    });

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'InventoryItem',
      entityId: updatedItem.id,
      userId: req.user.id,
      details: { movimentacao: tipo, quantidade: parseInt(qtd, 10), obs: obs, nomeItem: updatedItem.nome }
    });

    res.status(200).json(updatedItem);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
    res.status(400).json({ message: errorMessage, error: errorMessage });
  }
};

// Excluir item do estoque
export const deleteInventoryItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!req.user) return res.status(401).json({ message: "Não autorizado." });

    const itemToDelete = await prisma.inventoryItem.findUnique({ where: { id: parseInt(id, 10) } });
    if (!itemToDelete) {
        return res.status(404).json({ message: "Item não encontrado." });
    }
    if (itemToDelete.imageUrl) {
      deleteImageFile(itemToDelete.imageUrl);
    }
    
    // As exclusões em cascata no Prisma agora cuidam das relações
    await prisma.inventoryItem.delete({ where: { id: parseInt(id) } });

    if (itemToDelete) {
      await createAuditLog({
        action: 'DELETE',
        entityType: 'InventoryItem',
        entityId: id,
        userId: req.user.id,
        details: { nome: itemToDelete.nome }
      });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao apagar item do estoque.', error });
  }
};