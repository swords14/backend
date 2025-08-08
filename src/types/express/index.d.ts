// src/types/express/index.d.ts

// Sem o 'declare global', pois o arquivo já é global.
namespace Express {
  export interface Request {
    user?: {
      id: number;
      role: string;
    };
  }
}