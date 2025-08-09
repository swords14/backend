// Ficheiro: backend/src/controllers/company.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para buscar os dados da empresa
export const getCompanyData = async (req: Request, res: Response) => {
  try {
    // Usamos findFirst pois pode não haver registro ainda. O ID será sempre 1.
    const companyData = await prisma.company.findFirst({ where: { id: 1 } });
    if (!companyData) {
      // Se não houver dados, retorna um objeto vazio para o frontend preencher
      return res.status(200).json({});
    }
    res.status(200).json(companyData);
  } catch (error) {
    console.error("Erro ao buscar dados da empresa:", error);
    res.status(500).json({ message: 'Erro interno ao buscar dados da empresa.' });
  }
};

// Função para criar ou atualizar os dados da empresa
export const updateCompanyData = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // 'upsert' é perfeito aqui: ele atualiza o registro com id: 1 se existir,
    // ou cria o registro com id: 1 se não existir.
    const updatedCompanyData = await prisma.company.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    res.status(200).json(updatedCompanyData);
  } catch (error) {
    console.error("Erro ao atualizar dados da empresa:", error);
    res.status(500).json({ message: 'Erro interno ao atualizar dados da empresa.' });
  }
};