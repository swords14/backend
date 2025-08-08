// Ficheiro: backend/src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { createAuditLog } from '../controllers/audit.service';

const prisma = new PrismaClient();

// --- VALIDAÇÃO DE SEGURANÇA ---
// Garante que a variável de ambiente essencial existe.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("### ERRO CRÍTICO: A variável de ambiente JWT_SECRET não está definida. ###");
    console.error("### Por favor, adicione JWT_SECRET ao seu ficheiro .env e reinicie o servidor. ###");
    process.exit(1); // Impede o servidor de continuar a funcionar de forma insegura.
}

// Função para registrar um novo utilizador
export const registerUser = async (req: Request, res: Response) => {
  const { nome, email, password, roleId } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nome,
        email: email.toLowerCase(),
        password: hashedPassword,
        roleId: roleId || 2,
      },
      select: { id: true, nome: true, email: true, role: { select: { name: true } } }
    });
    
    await createAuditLog({
        userId: user.id,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user.id,
        details: { ip: req.ip }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Erro ao registrar utilizador:", error);
    if (error instanceof Error && (error as any).code === 'P2002') { 
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }
    res.status(500).json({ message: 'Erro ao registrar utilizador.' });
  }
};

// Função para login de utilizador
export const loginUser = async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }

    const isPasswordCorrect = await bcrypt.compare(senha, user.password);

    if (!isPasswordCorrect) {
      await createAuditLog({
          userId: user.id,
          action: 'LOGIN_FAILURE',
          entityType: 'Auth',
          entityId: user.id,
          details: { ip: req.ip, reason: 'Senha incorreta' }
      });
      return res.status(401).json({ message: 'Email ou senha inválidos.' });
    }
    
    if (user.isTwoFactorEnabled) {
      return res.status(200).json({
        twoFactorRequired: true,
        tempToken: jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '5m' })
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    await createAuditLog({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        entityType: 'Auth',
        entityId: user.id,
        details: { ip: req.ip }
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role.name,
        avatarUrl: user.avatarUrl,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    });

  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
  }
};

// Função para verificar o código 2FA durante o login
export const verifyTwoFactorToken = async (req: Request, res: Response) => {
    // A propriedade com o código de 6 dígitos chama-se 'token' no corpo do pedido
    const { token: twoFactorCode, tempToken } = req.body;

    if (!twoFactorCode || !tempToken) {
        return res.status(400).json({ message: 'Token temporário e código 2FA são obrigatórios.'});
    }

    try {
        const decoded: any = jwt.verify(tempToken, JWT_SECRET);
        const userId = decoded.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });

        if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
            return res.status(400).json({ message: "Utilizador não encontrado ou 2FA não configurado." });
        }

        const isValid = authenticator.verify({ token: twoFactorCode, secret: user.twoFactorSecret });

        if (!isValid) {
            await createAuditLog({
                userId: userId,
                action: '2FA_LOGIN_FAILURE',
                entityType: 'Auth',
                entityId: userId,
                details: { ip: req.ip }
            });
            return res.status(401).json({ message: "Código 2FA inválido." });
        }

        const finalToken = jwt.sign(
            { id: user.id, role: user.role.name },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        await createAuditLog({
            userId: userId,
            action: 'LOGIN_SUCCESS_2FA',
            entityType: 'Auth',
            entityId: userId,
            details: { ip: req.ip }
        });
        
        res.status(200).json({
            token: finalToken,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role.name,
                avatarUrl: user.avatarUrl,
                isTwoFactorEnabled: user.isTwoFactorEnabled,
            },
        });

    } catch (error) {
        res.status(401).json({ message: "Token temporário inválido ou expirado." });
    }
};


// Função para obter dados do utilizador autenticado
export const getAuthUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Nenhum utilizador autenticado na requisição.' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, nome: true, email: true, avatarUrl: true, isTwoFactorEnabled: true, role: { select: { name: true } } }
    });

    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado.' });
    res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar utilizador autenticado:", error);
    res.status(500).json({ message: 'Erro ao buscar dados do utilizador.' });
  }
};

// Função para Listar todos os utilizadores
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        avatarUrl: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao buscar utilizadores:", error);
    res.status(500).json({ message: 'Erro ao buscar utilizadores.' });
  }
};
