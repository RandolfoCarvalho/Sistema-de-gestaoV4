import statusConfig from '../components/Admin/Dashboard/components/StatusConfig';

// Mapa de status para ser usado na análise de dados
const STATUS_MAP = {
    0: { key: 'pedido-recebido', label: 'Recebido', color: '#3B82F6' },
    1: { key: 'pedido-em-producao', label: 'Em Produção', color: '#F59E0B' },
    2: { key: 'saiu-para-entrega', label: 'Em Entrega', color: '#8B5CF6' },
    3: { key: 'completo', label: 'Completo', color: '#10B981' },
    4: { key: 'cancelado', label: 'Cancelado', color: '#EF4444' },
    default: { key: 'desconhecido', label: 'Desconhecido', color: '#6B7280' }
};


/**
 * 1. Função unificada para filtrar pedidos por termo e datas.
 * Esta função é a base para o Kanban e os gráficos.
 */
const filterOrders = (allOrders, filters) => {
    const { searchTerm, startDate, endDate } = filters;
    
    // Garante que temos um array para trabalhar
    let filtered = Array.isArray(allOrders) ? [...allOrders] : [];

    // Mapeia os pedidos para garantir que a propriedade 'createdAt' exista
    let allFlatOrders = filtered.map(order => ({
        ...order,
        createdAt: order.dataPedido || order.createdAt,
    }));

    // Filtragem por termo de busca (nome do cliente ou número do pedido)
    if (searchTerm && searchTerm.trim() !== '') {
        const lowerSearchTerm = searchTerm.toLowerCase();
        allFlatOrders = allFlatOrders.filter(order =>
            (order.finalUserName?.toLowerCase().includes(lowerSearchTerm)) ||
            (order.numero?.toString().toLowerCase().includes(lowerSearchTerm))
        );
    }

    // Filtragem por data de início
    if (startDate) {
        const filterStartDate = new Date(startDate);
        const startYear = filterStartDate.getUTCFullYear();
        const startMonth = filterStartDate.getUTCMonth();
        const startDay = filterStartDate.getUTCDate();

        allFlatOrders = allFlatOrders.filter(order => {
            if (!order.createdAt) return false;
            const orderDateTime = new Date(order.createdAt);
            const orderYear = orderDateTime.getUTCFullYear();
            const orderMonth = orderDateTime.getUTCMonth();
            const orderDay = orderDateTime.getUTCDate();

            if (orderYear > startYear) return true;
            if (orderYear === startYear && orderMonth > startMonth) return true;
            if (orderYear === startYear && orderMonth === startMonth && orderDay >= startDay) return true;
            return false;
        });
    }

    // Filtragem por data de fim
    if (endDate) {
        const filterEndDate = new Date(endDate);
        const endYear = filterEndDate.getUTCFullYear();
        const endMonth = filterEndDate.getUTCMonth();
        const endDay = filterEndDate.getUTCDate();

        allFlatOrders = allFlatOrders.filter(order => {
            if (!order.createdAt) return false;
            const orderDateTime = new Date(order.createdAt);
            const orderYear = orderDateTime.getUTCFullYear();
            const orderMonth = orderDateTime.getUTCMonth();
            const orderDay = orderDateTime.getUTCDate();

            if (orderYear < endYear) return true;
            if (orderYear === endYear && orderMonth < endMonth) return true;
            if (orderYear === endYear && orderMonth === endMonth && orderDay <= endDay) return true;
            return false;
        });
    }

    return allFlatOrders;
};

/**
 * 2. Função para processar os dados para o formato do Kanban.
 * Agrupa os pedidos filtrados em colunas de status.
 */
export const processOrdersForKanban = (rawOrders, filters) => {
    const filtered = filterOrders(rawOrders, filters);
    
    const groupedOrders = {};
    Object.keys(statusConfig).forEach(key => { groupedOrders[key] = []; });

    const numericBackendToColumnKey = {
        0: 'pedido-recebido',
        1: 'pedido-em-producao',
        2: 'saiu-para-entrega',
        3: 'completo',
        4: 'Cancelado'
    };
    const backendStringEnumToColumnKey = {
        "NOVO": "pedido-recebido",
        "EM_PRODUCAO": "pedido-em-producao",
        "EM_ENTREGA": "saiu-para-entrega",
        "COMPLETO": "completo",
        "CANCELADO": "Cancelado"
    };

    filtered.forEach(order => {
        let targetColumnKey = null;
        const orderStatusValue = order.status;

        if (typeof orderStatusValue === 'string' && backendStringEnumToColumnKey.hasOwnProperty(orderStatusValue)) {
            targetColumnKey = backendStringEnumToColumnKey[orderStatusValue];
        } else if (typeof orderStatusValue === 'number' || (typeof orderStatusValue === 'string' && /^\d+$/.test(orderStatusValue))) {
            const numericStatus = parseInt(orderStatusValue, 10);
            targetColumnKey = numericBackendToColumnKey[numericStatus];
        } else if (typeof orderStatusValue === 'string') {
            const directMatchKey = Object.keys(statusConfig).find(
                scKey => scKey.toLowerCase() === orderStatusValue.toLowerCase()
            );
            if (directMatchKey) {
                targetColumnKey = directMatchKey;
            }
        }

        if (targetColumnKey && groupedOrders.hasOwnProperty(targetColumnKey)) {
            groupedOrders[targetColumnKey].push(order);
        }
    });

    return groupedOrders;
};

/**
 * 3. Função para processar os dados para o formato do AnalyticsDashboard.
 * Calcula todas as métricas, resumos e dados para os gráficos.
 */
export const calculateAnalyticsData = (rawOrders, filters) => {
    const filteredOrders = filterOrders(rawOrders, filters);

    // Lógica para quando não há dados
    if (!filteredOrders || filteredOrders.length === 0) {
        const nowForEmpty = new Date();
        const createEmptyLabels = (period) => {
            const labels = [];
            if (period === 'week') { for (let i = 6; i >= 0; i--) { const d = new Date(nowForEmpty); d.setDate(nowForEmpty.getDate() - i); labels.push({ label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }), key: d.toISOString().split('T')[0]});}}
            if (period === 'month') { for (let i = 29; i >= 0; i--) { const d = new Date(nowForEmpty); d.setDate(nowForEmpty.getDate() - i); labels.push({ label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), key: d.toISOString().split('T')[0]});}}
            if (period === 'year') { for (let i = 11; i >= 0; i--) { const d = new Date(nowForEmpty.getFullYear(), nowForEmpty.getMonth() - i, 1); labels.push({ label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), key: d.toISOString().substring(0, 7) });}}
            return labels.map(item => ({ name: item.label, key: item.key, orders: 0, revenue: 0, canceled: 0, costs: 0, profit: 0 }));
        };
        const emptySummary = { totalOrders: 0, totalRevenue: 0, totalCanceled: 0, totalCosts: 0, profit: 0 };
        return {
            weekData: createEmptyLabels('week'),
            monthData: createEmptyLabels('month'),
            yearData: createEmptyLabels('year'),
            statusDistribution: Object.values(STATUS_MAP).map(sInfo => ({ name: sInfo.label, value: 0, color: sInfo.color, key: sInfo.key })).filter(item => item.key !== STATUS_MAP.default.key),
            summary: emptySummary,
        };
    }

    // Geração de labels de data
    const now = new Date();
    const weekLabels = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() - (6 - i)); d.setHours(0,0,0,0); return { date: d, label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }), key: d.toISOString().split('T')[0] }; });
    const monthLabels = Array.from({ length: 30 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() - (29 - i)); d.setHours(0,0,0,0); return { date: d, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), key: d.toISOString().split('T')[0] }; });
    const yearLabels = Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1); d.setHours(0,0,0,0); return { date: d, label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), key: d.toISOString().substring(0, 7) }; });

    // Inicialização das estruturas de dados
    const createInitialData = (labels) => labels.map(item => ({ name: item.label, key: item.key, orders: 0, revenue: 0, canceled: 0, costs: 0 }));
    const weekData = createInitialData(weekLabels);
    const monthData = createInitialData(monthLabels);
    const yearData = createInitialData(yearLabels);
    const statusCounter = Object.fromEntries(Object.values(STATUS_MAP).map(s => [s.key, 0]));

    // Processamento de cada pedido filtrado
    filteredOrders.forEach(order => {
        if (!order.createdAt || !order.itens || !Array.isArray(order.itens)) return;
        const orderDate = new Date(order.createdAt);
        if (isNaN(orderDate.getTime())) return;
        orderDate.setHours(0,0,0,0);

        const orderValue = order.itens.reduce((total, item) => total + (item.subTotal || 0), 0);
        const orderCost = order.itens.reduce((total, item) => total + ((item.precoCusto || 0) * (item.quantidade || 1)), 0);
        const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.default;
        statusCounter[statusInfo.key]++;

        const weekKey = orderDate.toISOString().split('T')[0];
        const weekIndex = weekData.findIndex(d => d.key === weekKey);
        if (weekIndex !== -1) {
            weekData[weekIndex].orders++;
            weekData[weekIndex].revenue += orderValue;
            weekData[weekIndex].costs += orderCost;
            if (statusInfo.key === STATUS_MAP[4].key) weekData[weekIndex].canceled++;
        }

        const monthKey = orderDate.toISOString().split('T')[0];
        const monthIndex = monthData.findIndex(d => d.key === monthKey);
        if (monthIndex !== -1) {
            monthData[monthIndex].orders++;
            monthData[monthIndex].revenue += orderValue;
            monthData[monthIndex].costs += orderCost;
            if (statusInfo.key === STATUS_MAP[4].key) monthData[monthIndex].canceled++;
        }

        const yearKey = orderDate.toISOString().substring(0, 7);
        const yearIndex = yearData.findIndex(d => d.key === yearKey);
        if (yearIndex !== -1) {
            yearData[yearIndex].orders++;
            yearData[yearIndex].revenue += orderValue;
            yearData[yearIndex].costs += orderCost;
            if (statusInfo.key === STATUS_MAP[4].key) yearData[yearIndex].canceled++;
        }
    });

    // Finalização dos dados para os gráficos
    const finalStatusDistribution = Object.values(STATUS_MAP)
        .map(sInfo => ({ name: sInfo.label, value: statusCounter[sInfo.key] || 0, color: sInfo.color, key: sInfo.key }))
        .filter(item => item.value > 0 && item.key !== STATUS_MAP.default.key);
    
    const finalWeekData = weekData.map(d => ({ ...d, profit: d.revenue - d.costs }));
    const finalMonthData = monthData.map(d => ({ ...d, profit: d.revenue - d.costs }));
    const finalYearData = yearData.map(d => ({ ...d, profit: d.revenue - d.costs }));

    // Cálculo do resumo geral
    const summary = {
        totalOrders: filteredOrders.length,
        totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.itens?.reduce((total, item) => total + (item.subTotal || 0), 0) || 0), 0),
        totalCanceled: filteredOrders.filter(o => o.status === 4 || o.status === 'CANCELADO').length,
        totalCosts: filteredOrders.reduce((sum, order) => sum + (order.itens?.reduce((total, item) => total + ((item.precoCusto || 0) * (item.quantidade || 1)), 0) || 0), 0),
    };
    summary.profit = summary.totalRevenue - summary.totalCosts;

    return {
        weekData: finalWeekData,
        monthData: finalMonthData,
        yearData: finalYearData,
        statusDistribution: finalStatusDistribution,
        summary: summary,
    };
};