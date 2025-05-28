import React, { useState, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, BarChart4, TrendingUp, PieChart as PieIconLucide, DollarSign } from 'lucide-react'; // Renomeado PieIcon para evitar conflito

const STATUS_MAP = {
    0: { key: 'pedido-recebido', label: 'Recebido', color: '#3B82F6' },
    1: { key: 'pedido-em-producao', label: 'Em Produção', color: '#F59E0B' },
    2: { key: 'saiu-para-entrega', label: 'Em Entrega', color: '#8B5CF6' },
    3: { key: 'completo', label: 'Completo', color: '#10B981' },
    4: { key: 'cancelado', label: 'Cancelado', color: '#EF4444' },
    default: { key: 'desconhecido', label: 'Desconhecido', color: '#6B7280' }
};

const OrderAnalyticsDashboard = ({ orders }) => {
    const [timeRange, setTimeRange] = useState('week');
    const [chartType, setChartType] = useState('overview');
    const [isChartVisible, setIsChartVisible] = useState(true);

    const allOrders = useMemo(() => {
        if (!orders) return [];
        // Assumindo que 'orders' é um objeto como { key1: [order,...], key2: [order,...] }
        // Se 'orders' for um array direto [order1, order2,...], mude para:
        // return orders.map(order => ({ ...order, createdAt: order.dataPedido }));
        return Object.values(orders).flat().map(order => ({
            ...order,
            createdAt: order.dataPedido, // Usar a data original do pedido
        }));
    }, [orders]);

    const processOrdersData = useMemo(() => {
        if (!allOrders.length) return { weekData: [], monthData: [], yearData: [], statusDistribution: [] };

        const now = new Date();
        const weekLabels = [];
        const monthLabels = []; // Para os últimos 30 dias individualmente
        const yearLabels = []; // Para os últimos 12 meses

        // Geração de labels para a semana (últimos 7 dias)
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            date.setHours(0, 0, 0, 0); // Normalizar para o início do dia
            weekLabels.push({
                date: date,
                label: date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
                key: date.toISOString().split('T')[0]
            });
        }

        // Geração de labels para o mês (últimos 30 dias individualmente)
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            date.setHours(0, 0, 0, 0); // Normalizar
            monthLabels.push({
                date: date,
                label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                key: date.toISOString().split('T')[0]
            });
        }
        
        // Geração de labels para o ano (últimos 12 meses)
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            date.setHours(0, 0, 0, 0); // Normalizar para o início do mês
            yearLabels.push({
                date: date,
                label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                key: date.toISOString().substring(0, 7) // YYYY-MM
            });
        }

        const createInitialData = (labels) => labels.map(item => ({
            name: item.label,
            key: item.key,
            orders: 0,
            revenue: 0,
            canceled: 0,
            costs: 0
        }));

        const weekData = createInitialData(weekLabels);
        const monthData = createInitialData(monthLabels);
        const yearData = createInitialData(yearLabels);

        const statusCounter = Object.fromEntries(Object.values(STATUS_MAP).map(s => [s.key, 0]));

        allOrders.forEach(order => {
            if (!order.createdAt || !order.itens || !Array.isArray(order.itens)) return;
            
            const orderDate = new Date(order.createdAt);
            if (isNaN(orderDate.getTime())) return;
            orderDate.setHours(0,0,0,0); // Normalizar data do pedido para comparações

            const orderValue = order.itens.reduce((total, item) => total + (item.subTotal || 0), 0);
            const orderCost = order.itens.reduce((total, item) => total + (item.precoCusto || 0), 0);

            const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.default;
            const statusKey = statusInfo.key;
            statusCounter[statusKey]++;

            // Dados da Semana
            const weekKey = orderDate.toISOString().split('T')[0];
            const weekIndex = weekData.findIndex(d => d.key === weekKey);
            if (weekIndex >= 0) {
                weekData[weekIndex].orders += 1;
                weekData[weekIndex].revenue += orderValue;
                weekData[weekIndex].costs += orderCost;
                if (statusKey === STATUS_MAP[4].key) { // 'cancelado'
                    weekData[weekIndex].canceled += 1;
                }
            }

            // Dados do Mês (últimos 30 dias)
            const monthKey = orderDate.toISOString().split('T')[0];
            const monthIndex = monthData.findIndex(d => d.key === monthKey);
            if (monthIndex >= 0) {
                monthData[monthIndex].orders += 1;
                monthData[monthIndex].revenue += orderValue;
                monthData[monthIndex].costs += orderCost;
                if (statusKey === STATUS_MAP[4].key) { // 'cancelado'
                    monthData[monthIndex].canceled += 1;
                }
            }

            // Dados do Ano (agrupado por mês YYYY-MM)
            const yearKey = orderDate.toISOString().substring(0, 7);
            const yearIndex = yearData.findIndex(d => d.key === yearKey);
            if (yearIndex >= 0) {
                yearData[yearIndex].orders += 1;
                yearData[yearIndex].revenue += orderValue;
                yearData[yearIndex].costs += orderCost;
                if (statusKey === STATUS_MAP[4].key) { // 'cancelado'
                    yearData[yearIndex].canceled += 1;
                }
            }
        });

        const finalStatusDistribution = Object.values(STATUS_MAP)
            .map(sInfo => ({
                name: sInfo.label,
                value: statusCounter[sInfo.key] || 0,
                color: sInfo.color,
                key: sInfo.key
            }))
            .filter(item => item.value > 0 && item.key !== STATUS_MAP.default.key);

        return {
            weekData: weekData.map(d => ({ ...d, profit: d.revenue - d.costs })),
            monthData: monthData.map(d => ({ ...d, profit: d.revenue - d.costs })),
            yearData: yearData.map(d => ({ ...d, profit: d.revenue - d.costs })),
            statusDistribution: finalStatusDistribution
        };
    }, [allOrders]);

    const getChartData = () => {
        switch (timeRange) {
            case 'week':
                return processOrdersData.weekData;
            case 'month':
                return processOrdersData.monthData;
            case 'year':
                return processOrdersData.yearData;
            default:
                return processOrdersData.weekData;
        }
    };

    const currentChartData = getChartData(); // Renomeado para evitar conflito com 'data' em escopos internos

    const calculateSummary = (dataToSummarize) => {
        if (!dataToSummarize || dataToSummarize.length === 0) {
            return { totalOrders: 0, totalRevenue: 0, totalCanceled: 0, totalCosts: 0, profit: 0 };
        }
        return {
            totalOrders: dataToSummarize.reduce((sum, item) => sum + (item.orders || 0), 0),
            totalRevenue: dataToSummarize.reduce((sum, item) => sum + (item.revenue || 0), 0),
            totalCanceled: dataToSummarize.reduce((sum, item) => sum + (item.canceled || 0), 0),
            totalCosts: dataToSummarize.reduce((sum, item) => sum + (item.costs || 0), 0),
            profit: dataToSummarize.reduce((sum, item) => sum + ((item.revenue || 0) - (item.costs || 0)), 0),
        };
    };

    const summary = calculateSummary(currentChartData);
    
    const chartColors = useMemo(() => ({ // Renomeado 'colors' para 'chartColors' para evitar conflito
        orders: '#3B82F6',
        revenue: '#10B981',
        canceled: '#EF4444',
        costs: '#8B5CF6',
        profit: '#F59E0B'
    }), []);


    const renderChart = () => {
        if (!currentChartData || currentChartData.length === 0) {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-gray-500">
                     <PieIconLucide size={48} className="mb-4" /> 
                    <p className="text-lg">Sem dados para exibir no período selecionado.</p>
                </div>
            );
        }
        // ... (resto da lógica de renderChart, usando chartColors em vez de colors)
        // Exemplo de como usar chartColors:
        // stroke={chartColors.orders} fill={chartColors.orders}

        // (O conteúdo de renderChart() é longo, então vou omitir para brevidade, 
        // mas você deve substituir todas as instâncias de 'colors.X' por 'chartColors.X' nele)

        // Colando a lógica de renderChart aqui e fazendo as substituições necessárias
        switch (chartType) {
            case 'overview':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={currentChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip formatter={(value, name) => {
                                const valueName = String(name); // Garantir que 'name' seja string
                                if (valueName === 'revenue' || valueName === 'costs' || valueName === 'profit') {
                                    return [`R$ ${Number(value).toFixed(2)}`, valueName === 'revenue' ? 'Receita' : valueName === 'costs' ? 'Custos' : 'Lucro'];
                                }
                                return [value, valueName === 'orders' ? 'Pedidos' : 'Cancelados'];
                            }} />
                            <Legend formatter={(value) => {
                                switch (value) {
                                    case 'orders': return 'Pedidos';
                                    case 'revenue': return 'Receita (R$)';
                                    case 'costs': return 'Custos (R$)';
                                    case 'profit': return 'Lucro (R$)';
                                    default: return value;
                                }
                            }} />
                            <Area
                                type="monotone"
                                dataKey="orders"
                                name="orders"
                                stroke={chartColors.orders}
                                fill={chartColors.orders}
                                fillOpacity={0.3}
                                yAxisId="left"
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="revenue"
                                stroke={chartColors.revenue}
                                fill={chartColors.revenue}
                                fillOpacity={0.3}
                                yAxisId="right"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'finance':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={currentChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value, name) => {
                                const valueName = String(name);
                                if (valueName === 'revenue' || valueName === 'costs' || valueName === 'profit') {
                                    return [`R$ ${Number(value).toFixed(2)}`, valueName === 'revenue' ? 'Receita' : valueName === 'costs' ? 'Custos' : 'Lucro'];
                                }
                                return [value, valueName];
                            }} />
                            <Legend formatter={(value) => {
                                switch (value) {
                                    case 'revenue': return 'Receita';
                                    case 'costs': return 'Custos';
                                    case 'profit': return 'Lucro';
                                    default: return value;
                                }
                            }} />
                            <Bar dataKey="revenue" name="revenue" fill={chartColors.revenue} />
                            <Bar dataKey="costs" name="costs" fill={chartColors.costs} />
                            <Bar dataKey="profit" name="profit" fill={chartColors.profit} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'orders':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={currentChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [value, String(name) === 'orders' ? 'Pedidos' : 'Cancelados']} />
                            <Legend formatter={(value) => String(value) === 'orders' ? 'Pedidos' : 'Cancelados'} />
                            <Line
                                type="monotone"
                                dataKey="orders"
                                name="orders"
                                stroke={chartColors.orders}
                                activeDot={{ r: 8 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="canceled"
                                name="canceled"
                                stroke={chartColors.canceled}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'status':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={processOrdersData.statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={150}
                                fill="#8884d8" // Cor base, será sobrescrita pelas Cells
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {processOrdersData.statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };


    // Calculate profit margin (prevent division by zero)
    const profitMargin = summary.totalRevenue > 0
        ? ((summary.profit / summary.totalRevenue) * 100).toFixed(1)
        : "0.0"; // Retornar string para consistência com .toFixed()

    // Calculate cancellation rate
    const cancellationRate = summary.totalOrders > 0
        ? ((summary.totalCanceled / summary.totalOrders) * 100).toFixed(1)
        : "0.0";

    // Calculate average order value
    const averageOrderValue = summary.totalOrders > 0
        ? (summary.totalRevenue / summary.totalOrders).toFixed(2)
        : "0.00";
    
    // Para "Dia com mais pedidos" nos Insights
    let peakDayInfo = { name: 'N/A', orders: 0 };
    if (currentChartData && currentChartData.length > 0) {
        peakDayInfo = currentChartData.reduce((maxItem, currentItem) => {
            return (currentItem.orders || 0) > (maxItem.orders || 0) ? currentItem : maxItem;
        }, currentChartData[0]); // Inicial seguro pois currentChartData.length > 0
    }


    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">Análise Detalhada de Pedidos</h3>
                <button
                    onClick={() => setIsChartVisible(!isChartVisible)}
                    className="text-sm text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50"
                >
                    {isChartVisible ? 'Minimizar Gráficos ▲' : 'Expandir Gráficos ▼'}
                </button>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                {/* Chart type selector */}
                <div className="flex flex-wrap justify-center md:justify-start space-x-1 sm:space-x-2 mb-4 md:mb-0">
                    {[
                        { type: 'overview', label: 'Visão Geral', icon: BarChart4 },
                        { type: 'finance', label: 'Financeiro', icon: DollarSign },
                        { type: 'orders', label: 'Pedidos', icon: TrendingUp },
                        // { type: 'status', label: 'Status', icon: PieIconLucide } // Descomente se quiser reativar
                    ].map(item => (
                        <button
                            key={item.type}
                            onClick={() => setChartType(item.type)}
                            className={`flex items-center gap-2 px-2 py-2 sm:px-3 text-xs sm:text-sm rounded-md transition-colors ${chartType === item.type
                                    ? (item.type === 'overview' ? 'bg-blue-600 text-white' :
                                        item.type === 'finance' ? 'bg-green-600 text-white' :
                                            item.type === 'orders' ? 'bg-purple-600 text-white' :
                                                'bg-amber-600 text-white')
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <item.icon size={16} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Time range selector */}
                <div className="flex flex-wrap justify-center md:justify-end space-x-1 sm:space-x-2">
                     {['week', 'month', 'year'].map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`flex items-center gap-2 px-2 py-2 sm:px-3 text-xs sm:text-sm rounded-md transition-colors ${timeRange === range ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Calendar size={16} />
                            <span>{range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Ano'}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total de Pedidos', value: summary.totalOrders, color: 'blue', format: val => val },
                    { label: 'Receita Total', value: summary.totalRevenue, color: 'green', format: val => `R$ ${val.toFixed(2)}` },
                    { label: 'Custos Totais', value: summary.totalCosts, color: 'purple', format: val => `R$ ${val.toFixed(2)}` },
                    { label: 'Lucro Total', value: summary.profit, color: 'amber', format: val => `R$ ${val.toFixed(2)}` }
                ].map(card => (
                    <div key={card.label} className={`bg-${card.color}-50 p-4 rounded-lg shadow`}>
                        <div className={`text-${card.color}-600 text-sm font-medium mb-1`}>{card.label}</div>
                        <div className="text-2xl font-bold text-gray-800">{card.format(card.value)}</div>
                    </div>
                ))}
            </div>

            {isChartVisible && (
                <>
                    {/* Chart */}
                    <div className="bg-gray-50 p-2 sm:p-4 rounded-lg shadow">
                        {renderChart()}
                    </div>

                    {/* Insights section */}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Insights Rápidos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg shadow">
                                <h4 className="font-medium text-blue-700">Período de Pico de Pedidos</h4>
                                <p className="text-gray-600 mt-1">
                                    {currentChartData && currentChartData.length > 0 && peakDayInfo.orders > 0
                                        ? `${peakDayInfo.name} com ${peakDayInfo.orders} pedido(s).`
                                        : 'Sem dados suficientes para análise.'}
                                </p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg shadow">
                                <h4 className="font-medium text-green-700">Margem de Lucro Média</h4>
                                <p className="text-gray-600 mt-1">
                                    Sua margem de lucro média é de {profitMargin}%.
                                </p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg shadow"> {/* Mudado para cor de cancelamento */}
                                <h4 className="font-medium text-red-700">Taxa de Cancelamento</h4>
                                <p className="text-gray-600 mt-1">
                                    Sua taxa de cancelamento é de {cancellationRate}%.
                                </p>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-lg shadow">
                                <h4 className="font-medium text-amber-700">Valor Médio do Pedido</h4>
                                <p className="text-gray-600 mt-1">
                                    O valor médio por pedido é R$ {averageOrderValue}.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderAnalyticsDashboard;