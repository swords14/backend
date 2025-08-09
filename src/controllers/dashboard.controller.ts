// Caminho do arquivo: backend/src/controllers/dashboard.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, startOfWeek, endOfWeek, format, addWeeks, addMonths, subYears, subMonths, startOfDay, formatDistanceToNow } from 'date-fns'; 
import { ptBR } from 'date-fns/locale';

const prisma = new PrismaClient();

// Função auxiliar para obter o intervalo de datas com base no período
const getPeriodDates = (periodo: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (periodo) {
        case 'semana':
            startDate = startOfWeek(now, { locale: ptBR, weekStartsOn: 1 });
            endDate = endOfWeek(now, { locale: ptBR, weekStartsOn: 1 });
            break;
        case 'trimestre':
            startDate = startOfQuarter(now);
            endDate = endOfQuarter(now);
            break;
        case 'ano':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
        case 'mes':
        default:
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
    }
    return { startDate, endDate };
};

// --- FUNÇÃO PARA SALVAR O LAYOUT DO USUÁRIO ---
export const saveUserDashboardLayout = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { layout } = req.body;

    try {
        const savedLayout = await prisma.dashboardLayout.upsert({
            where: { userId },
            update: { layout: layout as any },
            create: { userId, layout: layout as any }
        });
        res.status(200).json(savedLayout);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar o layout do dashboard.' });
    }
};

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const periodo = req.query.periodo as string || 'mes';
    const hoje = new Date();
    const inicioDeHoje = startOfDay(hoje);
    const { startDate, endDate } = getPeriodDates(periodo);

    // --- 1. CÁLCULO DOS KPIs GERAIS ---
    const eventosNoPeriodo = await prisma.event.count({
      where: { startDate: { gte: startDate, lte: endDate }, status: { in: ['Confirmado', 'Realizado'] } },
    });
    
    const receitaRealizadaResult = await prisma.transaction.aggregate({
        _sum: { valor: true },
        where: { tipo: 'receita', status: 'Concluída', data: { gte: startDate, lte: endDate } },
    });
    const receitaRealizada = receitaRealizadaResult._sum.valor || 0;

    const despesaRealizadaResult = await prisma.transaction.aggregate({
        _sum: { valor: true },
        where: { tipo: 'despesa', status: 'Concluída', data: { gte: startDate, lte: endDate } },
    });
    const despesaRealizada = despesaRealizadaResult._sum.valor || 0;

    const novosClientes = await prisma.client.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    const orcamentosEnviadosParaCalculo = await prisma.budget.count({
        where: { 
            createdAt: { gte: startDate, lte: endDate }, 
            status: { in: ['Orçamento Enviado', 'Follow-up', 'Em Negociação', 'Aprovado', 'Recusado', 'Rascunho'] }
        },
    });

    const orcamentosAprovadosParaCalculo = await prisma.budget.count({
        where: { 
            createdAt: { gte: startDate, lte: endDate }, 
            status: 'Aprovado' 
        },
    });

    const taxaConversao = orcamentosEnviadosParaCalculo > 0 ? parseFloat(((orcamentosAprovadosParaCalculo / orcamentosEnviadosParaCalculo) * 100).toFixed(1)) : 0;
    
    const orcamentosPendentes = await prisma.budget.count({ 
        where: { 
            status: { in: ['Orçamento Enviado', 'Follow-up', 'Em Negociação'] } 
        } 
    });

    const tarefasAtrasadas = await prisma.task.count({ 
        where: { 
            status: { notIn: ['Concluída', 'Cancelada'] }, 
            dueDate: { lt: inicioDeHoje } 
        } 
    });

    const pagamentosAtrasados = await prisma.transaction.count({ 
        where: { 
            status: { notIn: ['Concluída', 'Cancelada'] },
            tipo: 'receita',
            dataVencimento: { lt: new Date() } 
        } 
    });
    
    const feedbacksPendentes = await prisma.feedback.count({
        where: {
            autorizaDepoimento: false, // Exemplo de lógica
        }
    }) || 0;

    const allClientsWithEvents = await prisma.client.findMany({
        select: { id: true, _count: { select: { events: { where: { status: { in: ['Confirmado', 'Realizado'] } } } } } },
    });
    const clientesRecorrentesContagem = allClientsWithEvents.filter(c => c._count.events >= 2).length;
    const totalClientes = await prisma.client.count();
    const clientesNovosContagem = totalClientes - clientesRecorrentesContagem;

    const kpis = {
      eventosNoPeriodo,
      receitaRealizada,
      despesaRealizada,
      novosClientes,
      taxaConversao,
      orcamentosPendentes,
      tarefasAtrasadas,
      pagamentosAtrasados,
      feedbacksPendentes,
      clientesNovos: clientesNovosContagem,
      clientesRecorrentes: clientesRecorrentesContagem,
    };

    // --- 2. DADOS PARA GRÁFICOS ---
    const graficoFinanceiro: Array<{ name: string; receita: number; despesa: number; meta: number }> = [];
    let currentIterDate = startDate;
    let totalIntervalsForMeta = 0;
    let tempDateForCount = startDate;

    if (periodo === 'ano') {
        while (tempDateForCount <= endDate) {
            totalIntervalsForMeta++;
            tempDateForCount = addMonths(tempDateForCount, 1);
        }
    } else {
        while (tempDateForCount <= endDate) {
            totalIntervalsForMeta++;
            tempDateForCount = addWeeks(tempDateForCount, 1);
        }
    }
    const initialReceitaParaMeta = receitaRealizada > 0 ? receitaRealizada : 1;
    const metaPorIntervaloBase = totalIntervalsForMeta > 0 ? (initialReceitaParaMeta / totalIntervalsForMeta) * 1.1 : 0;

    let safetyBreak = 0;
    while (currentIterDate <= endDate && safetyBreak < 100) {
        let intervalEnd: Date;
        let nameLabel: string;
        let nextIterDate: Date;

        if (periodo === 'ano') {
            intervalEnd = endOfMonth(currentIterDate);
            nameLabel = format(currentIterDate, 'MMM/yy', { locale: ptBR });
            nextIterDate = addMonths(currentIterDate, 1);
        } else {
            intervalEnd = endOfWeek(currentIterDate, { locale: ptBR, weekStartsOn: 1 });
            nameLabel = format(currentIterDate, 'dd/MM', { locale: ptBR });
            nextIterDate = addWeeks(currentIterDate, 1);
        }

        if (intervalEnd > endDate) {
            intervalEnd = endDate;
        }

        const intervalRevenue = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: {
                data: { gte: currentIterDate, lte: intervalEnd },
                tipo: 'receita',
                status: 'Concluída'
            }
        });
        const intervalExpense = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: {
                data: { gte: currentIterDate, lte: intervalEnd },
                tipo: 'despesa',
                status: 'Concluída'
            }
        });
        
        graficoFinanceiro.push({
            name: nameLabel,
            receita: intervalRevenue._sum.valor || 0,
            despesa: intervalExpense._sum.valor || 0,
            meta: metaPorIntervaloBase,
        });
        currentIterDate = nextIterDate;
        safetyBreak++;
    }

    const statusCounts = await prisma.event.groupBy({
        by: ['status'],
        _count: {
            id: true,
        },
        where: {
            startDate: { gte: startDate, lte: endDate }
        },
    });

    const graficoStatusEventos = statusCounts.map(s => ({
        name: s.status,
        value: s._count.id,
    }));


    // --- 3. DADOS PARA LISTAS ---
    const proximasTarefas = await prisma.task.findMany({
        where: {
            status: { notIn: ['Concluída', 'Cancelada'] },
            priority: {
                equals: 'Crítica',
                mode: 'insensitive'
            },
            dueDate: { lt: inicioDeHoje }
        },
        orderBy: {
            dueDate: 'asc'
        },
        take: 5,
        include: {
            event: { select: { title: true } }
        }
    });

    const formattedTarefas = proximasTarefas.map(task => ({
        id: task.id,
        descricao: task.title,
        evento: task.event?.title || 'Tarefa sem evento',
        dueDate: task.dueDate,
        prioridade: task.priority?.toLowerCase().includes('crítica') ? 'alta' : 'media',
    }));


    // ===== ATIVIDADE RECENTE (SEÇÃO TOTALMENTE REFEITA) =====
    const atividadesDeLog = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            user: { select: { nome: true } }
        }
    });

    // Mapeamento para nomes amigáveis, inspirado no seu frontend
    const entityTypeTranslations: { [key: string]: string } = {
        'Client': 'Clientes',
        'Event': 'Eventos',
        'Transaction': 'Transações',
        'Supplier': 'Fornecedores',
        'InventoryItem': 'Estoque',
        'User': 'Usuários',
        'Auth': 'Autenticação',
        'Task': 'Tarefas',
        'Budget': 'Orçamentos'
    };

    const atividadeRecente = atividadesDeLog.map(log => {
        let textoAtividade = '';
        const entityName = entityTypeTranslations[log.entityType] || log.entityType;

        // Lógica para "traduzir" a ação em uma frase
        switch (log.action) {
            case 'LOGIN_SUCCESS':
            case 'LOGIN_SUCCESS_2FA':
                textoAtividade = `Fez login no sistema.`;
                break;
            case 'LOGIN_FAILURE':
                const reason = (log.details as any)?.reason || 'motivo desconhecido';
                textoAtividade = `Tentativa de login falhou: ${reason}.`;
                break;
            case 'USER_REGISTERED':
                 textoAtividade = `Um novo usuário foi registrado.`;
                 break;
            case '2FA_LOGIN_FAILURE':
                textoAtividade = `Falha na verificação de 2 fatores.`;
                break;
            case 'CREATE':
                textoAtividade = `Criou um novo item em ${entityName}.`;
                break;
            case 'UPDATE':
                textoAtividade = `Atualizou um item em ${entityName} (ID: ${log.entityId}).`;
                break;
            case 'DELETE':
                textoAtividade = `Excluiu um item de ${entityName} (ID: ${log.entityId}).`;
                break;
            default:
                // Fallback para qualquer outra ação não mapeada
                textoAtividade = `Executou a ação '${log.action}' em ${entityName}.`;
        }
        
        // Define o tipo do ícone a ser mostrado no frontend
        let tipoIcone = 'ATIVIDADE_GERAL';
        if (log.entityType === 'Client') tipoIcone = 'NOVO_CLIENTE';
        if (log.entityType === 'Event') tipoIcone = 'EVENTO_CONFIRMADO';
        if (log.entityType === 'Transaction') tipoIcone = 'PAGAMENTO_RECEBIDO';


        return {
            id: log.id,
            tipo: tipoIcone,
            texto: textoAtividade,
            data: log.createdAt,
            user: log.user?.nome || 'Sistema',
        };
    });

    // --- Busca o layout salvo do usuário (se existir) ---
    const userLayout = await prisma.dashboardLayout.findUnique({
        where: { userId },
        select: { layout: true }
    });


    // --- RESPOSTA FINAL ---
    res.status(200).json({
      kpis,
      graficoFinanceiro,
      graficoStatusEventos,
      proximasTarefas: formattedTarefas,
      atividadeRecente,
      // Retorna o layout salvo, se existir
      userLayout: userLayout?.layout,
    });

  } catch (error) {
    console.error("Erro ao buscar dados da dashboard:", error);
    res.status(500).json({ message: 'Erro ao buscar dados da dashboard.' });
  }
};