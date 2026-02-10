// Caminho: backend/src/server.ts

import 'dotenv/config';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import path from 'path';

// --- Importação das Rotas ---
import authRoutes from './routes/auth.routes';
import clientRoutes from './routes/client.routes';
import eventRoutes from './routes/event.routes';
import dashboardRoutes from './routes/dashboard.routes';
import transactionRoutes from './routes/transaction.routes';
import supplierRoutes from './routes/supplier.routes';
import inventoryRoutes from './routes/inventory.route';
import calendarRoutes from './routes/calendar.routes';
import reportRoutes from './routes/report.routes';
import auditRoutes from './routes/audit.routes';
import companyRoutes from './routes/company.routes';
import userRoutes from './routes/user.routes';
import permissionRoutes from './routes/permission.routes';
import roleRoutes from './routes/role.routes';
import documentTemplateRoutes from './routes/documentTemplate.routes';
import budgetRoutes from './routes/budget.routes';
import serviceRoutes from './routes/service.routes';
import segurancaRoutes from './routes/seguranca.routes';
import { layoutRoutes } from './routes/layout.routes';
import taskRoutes from './routes/task.routes';
import contractRoutes from './routes/contract.routes';
import feedbackRoutes from './routes/feedback.routes';
import funnelRoutes from './routes/funnel.routes';

const app = express();
const PORT = process.env.PORT || 3333;

// --- Configuração de CORS (Corrigida) ---
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // 1. Permite requisições sem 'origin' (como Postman, Insomnia, Mobile Apps ou Server-to-Server)
    if (!origin) {
      return callback(null, true);
    }

    // 2. Lista de domínios permitidos explicitamente
    const allowedOrigins = [
      'https://frontend-erclat.vercel.app', // Sua produção oficial
      'http://localhost:3000',              // Seu desenvolvimento local
      'http://localhost:5173'               // Vite local (caso use porta diferente)
    ];

    // 3. Verifica se está na lista explícita
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 4. Regex para aceitar TODOS os Previews da Vercel do seu projeto
    // Aceita: https://frontend-erclat-git-master.vercel.app
    // Aceita: https://frontend-erclat-pvhr6j6ge-swords14s-projects.vercel.app
    // A lógica: Começa com "https://frontend-erclat", tem qualquer coisa no meio, termina com ".vercel.app"
    const vercelPreviewPattern = /^https:\/\/frontend-erclat.*\.vercel\.app$/;

    if (vercelPreviewPattern.test(origin)) {
      return callback(null, true);
    }

    // 5. Se não passou em nada, bloqueia e LOGA O ERRO (Importante para o Render)
    console.error('🚫 Bloqueado pelo CORS. Origem tentada:', origin);
    callback(new Error('Bloqueado pela política de CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  credentials: true, // Permite cookies/headers de autorização
  optionsSuccessStatus: 200
};

// --- Aplicação dos Middlewares ---
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (Uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// --- Definição das Rotas ---
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/templates', documentTemplateRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/seguranca', segurancaRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/funnel', funnelRoutes);
app.use('/api', layoutRoutes); 

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor a rodar na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});