// Ficheiro: backend/src/controllers/seguranca.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { createAuditLog } from '../controllers/audit.service'; // CAMINHO E NOME CORRIGIDOS

const prisma = new PrismaClient();

// --- 1. ALTERAÇÃO DE SENHA ---
export const changePassword = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }
  const userId = req.user.id;
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const isPasswordCorrect = await bcrypt.compare(senhaAtual, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'A senha atual está incorreta.' });
    }

    const hashedNewPassword = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Registra a atividade usando a função correta
    await createAuditLog({
      userId: userId,
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      entityId: userId,
      details: { ip: req.ip }
    });

    res.status(200).json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ message: 'Erro ao alterar a senha.' });
  }
};

// --- 2. GERAÇÃO E ATIVAÇÃO DO 2FA ---
export const generateTwoFactorSecret = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autorizado.' });
  }
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'SeuAppNome', secret); // É bom nomear o serviço

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, isTwoFactorEnabled: false },
    });

    qrcode.toDataURL(otpauth, (err, imageUrl) => {
      if (err) {
        console.error("Erro ao gerar QR Code:", err);
        return res.status(500).json({ message: 'Erro ao gerar QR Code.' });
      }
      res.status(200).json({ qrCodeUrl: imageUrl });
    });
  } catch (error) {
    console.error("Erro ao gerar segredo 2FA:", error);
    res.status(500).json({ message: 'Erro ao gerar segredo 2FA.' });
  }
};

export const enableTwoFactorAuth = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'O código de verificação é obrigatório.'});
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ message: 'Segredo 2FA não gerado ou usuário não encontrado.' });
        }

        const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });
        if (!isValid) {
            return res.status(400).json({ message: 'Código de verificação inválido.' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: true },
        });

        await createAuditLog({
            userId: userId,
            action: '2FA_ENABLED',
            entityType: 'User',
            entityId: userId,
            details: { ip: req.ip }
        });
        res.status(200).json({ message: 'Autenticação de dois fatores ativada com sucesso.' });
    } catch (error) {
        console.error("Erro ao ativar 2FA:", error);
        res.status(500).json({ message: 'Erro ao ativar 2FA.' });
    }
};

export const disableTwoFactorAuth = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }
    const userId = req.user.id;
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: false, twoFactorSecret: null },
        });

        await createAuditLog({
            userId: userId,
            action: '2FA_DISABLED',
            entityType: 'User',
            entityId: userId,
            details: { ip: req.ip }
        });
        res.status(200).json({ message: 'Autenticação de dois fatores desativada.' });
    } catch (error) {
        console.error("Erro ao desativar 2FA:", error);
        res.status(500).json({ message: 'Erro ao desativar 2FA.' });
    }
};


// --- 3. LOG DE ATIVIDADE ---
export const getActivityLog = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autorizado.' });
    }
    const userId = req.user.id;
    try {
        const logs = await prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.status(200).json(logs);
    } catch (error) {
        console.error("Erro ao buscar logs:", error);
        res.status(500).json({ message: 'Erro ao buscar log de atividades.' });
    }
};
