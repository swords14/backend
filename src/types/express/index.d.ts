// src/types/express/index.d.ts

// Extensão do tipo Request do Express para incluir informações do usuário autenticado
namespace Express {
  export interface Request {
    user?: {
      id: number;
      role: string;
    };
  }
}