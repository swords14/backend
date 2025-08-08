// Ficheiro: backend/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// --- VALIDAÇÃO DE SEGURANÇA ---
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("### ERRO CRÍTICO: A variável de ambiente JWT_SECRET não está definida. ###");
    console.error("### Verifique se o seu ficheiro .env está a ser carregado corretamente no início da sua aplicação. ###");
    process.exit(1);
}

// --- TIPAGEM ---
// Adiciona a propriedade 'user' ao tipo Request do Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      }
    }
  }
}

// Define uma interface para o conteúdo descodificado do token
interface TokenPayload {
  id: number;
  role: string;
  iat: number;
  exp: number;
}


/**
 * Middleware para proteger rotas. Verifica se o token JWT é válido
 * e anexa os dados do utilizador à requisição (`req.user`).
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Validação explícita contra tokens corrompidos
      if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ message: 'Não autorizado, token inválido ou não fornecido.' });
      }

      // Verifica e descodifica o token com o segredo validado
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

      // Validação do formato do payload descodificado
      if (typeof decoded.id !== 'number' || typeof decoded.role !== 'string') {
        throw new Error('Payload do token com formato inválido.');
      }

      // Anexa o utilizador à requisição
      req.user = {
        id: decoded.id,
        role: decoded.role,
      };

      next();
    } catch (error) {
      // Registo de erro melhorado no backend para depuração
      console.error('Falha na autenticação no middleware "protect":', {
        errorMessage: (error as Error).message,
        tokenRecebido: token, // Regista o token que causou o erro
      });
      return res.status(401).json({ message: 'Não autorizado. O token pode ser inválido ou expirado.' });
    }
  } else {
    // Erro mais específico se o cabeçalho estiver em falta
    return res.status(401).json({ message: 'Não autorizado, cabeçalho de autorização em falta ou mal formatado.' });
  }
};

/**
 * Middleware para autorizar acesso com base no cargo (role).
 * Deve ser usado DEPOIS do middleware 'protect'.
 * @param {...string} roles - Uma lista de cargos que têm permissão para aceder à rota.
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado: você não tem permissão para esta ação.' });
    }
    next();
  };
};
