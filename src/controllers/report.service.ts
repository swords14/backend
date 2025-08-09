import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Relatório Financeiro ---
export const generateFinanceiroReport = async (startDate: Date, endDate: Date) => {
    const transacoes = await prisma.transaction.findMany({
        where: {
            data: {
                gte: startDate,
                lte: endDate,
            },
        },
        orderBy: {
            data: 'desc'
        }
    });

    const receita = transacoes
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);

    const despesa = transacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);
    
    const lucro = receita - despesa;

    const despesasPorCategoria = await prisma.transaction.groupBy({
        by: ['categoria'],
        where: {
            tipo: 'despesa',
            categoria: { not: null }, // Garante que não agrupe categorias nulas
            data: { gte: startDate, lte: endDate },
        },
        _sum: {
            valor: true,
        },
        orderBy: {
            _sum: {
                valor: 'desc',
            },
        },
    });

    return {
        kpis: { receita, despesa, lucro },
        despesasPorCategoria: despesasPorCategoria.map(item => ({
            name: item.categoria,
            // CORREÇÃO 1: Usar 'item._sum.valor' com underscore.
            value: item._sum.valor || 0,
        })),
        // CORREÇÃO 2: Garante que transacoesRecentes é definido corretamente.
        transacoesRecentes: transacoes.slice(0, 10),
    };
};


// --- Relatório de Vendas ---
// CORREÇÃO 3: Estrutura da função corrigida para evitar erros de escopo.
export const generateVendasReport = async (startDate: Date, endDate: Date) => {
    const orcamentos = await prisma.budget.findMany({
        where: {
            // CORREÇÃO 4: O campo no schema é 'createdAt' e não 'created_at'.
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    const total = orcamentos.length;
    const aceitos = orcamentos.filter(o => o.status === 'Aceito').length;
    const recusados = orcamentos.filter(o => o.status === 'Recusado').length;
    const conversao = (aceitos + recusados) > 0 ? (aceitos / (aceitos + recusados)) * 100 : 0;
    
    const valorAceito = orcamentos
        .filter(o => o.status === 'Aceito')
        // CORREÇÃO 5: O campo no schema é 'valorTotal' e não 'valor_total'.
        .reduce((sum, o) => sum + o.valorTotal, 0);

    const ticketMedio = aceitos > 0 ? valorAceito / aceitos : 0;

    return {
        kpis: { total, aceitos, conversao, valorAceito, ticketMedio, recusados },
        funilData: [
            { name: 'Total de Orçamentos', value: total },
            { name: 'Aceitos', value: aceitos },
            { name: 'Recusados', value: recusados },
        ]
    };
};


// --- Relatório de Lucratividade por Evento ---
export const generateLucratividadeEventoReport = async () => {
    const eventos = await prisma.event.findMany({
        where: {
            transactions: {
                some: {},
            },
        },
        include: {
            transactions: true,
        },
    });

    const analise = eventos.map(evento => {
        const receita = evento.transactions
            .filter(t => t.tipo === 'receita')
            .reduce((s, t) => s + t.valor, 0);

        const custos = evento.transactions
            .filter(t => t.tipo === 'despesa')
            .reduce((s, t) => s + t.valor, 0);
        
        const lucro = receita - custos;
        const margem = receita > 0 ? (lucro / receita) * 100 : 0;

        return {
            id: evento.id,
            title: evento.title,
            receita,
            custos,
            lucro,
            margem,
        };
    }).sort((a, b) => b.lucro - a.lucro);

    return analise;
};