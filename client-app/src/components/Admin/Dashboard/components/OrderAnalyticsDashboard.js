import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, BarChart4, TrendingUp, PieChart as PieIcon, DollarSign } from 'lucide-react';

const OrderAnalyticsDashboard = ({ orders }) => {
    const [timeRange, setTimeRange] = useState('week');
    const [chartType, setChartType] = useState('overview');
    const allOrders = useMemo(() => {
        if (!orders) return [];
        return Object.values(orders).flat().map(order => ({
            ...order,
            createdAt: order.dataPedido,
            status: order.status,
        }));
    }, [orders]);

    const processOrdersData = useMemo(() => {
        if (!allOrders.length) return { weekData: [], monthData: [], yearData: [], statusDistribution: [] };

        const now = new Date();
        const ordersByDate = new Map();
        const weekLabels = [];
        const monthLabels = [];
        const yearLabels = [];

        //semana
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            weekLabels.push({
                date: new Date(date),
                label: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
                key: date.toISOString().split('T')[0]
            });
        }
        //mes
        // Geração de monthLabels
        for (let i = 30; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const startOfGroup = new Date(date);
            startOfGroup.setDate(date.getDate() - (date.getDate() % 1)); 
            const endOfGroup = new Date(startOfGroup);
            endOfGroup.setDate(startOfGroup.getDate() + 2);
        
            monthLabels.push({
                date: startOfGroup,
                label: `${startOfGroup.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${endOfGroup.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
                key: startOfGroup.toISOString().split('T')[0],
            });
        }

        //ano
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            yearLabels.push({
                date: new Date(date),
                label: date.toLocaleDateString('pt-BR', { month: 'short' }),
                key: date.toISOString().substring(0, 7)
            });

        }
        const weekData = weekLabels.map(item => ({
            name: item.label,
            key: item.key,
            orders: 0,
            revenue: 0,
            canceled: 0,
            costs: 0
        }));

        const monthData = monthLabels.map(item => ({
            name: item.label,
            key: item.key,
            orders: 0,
            revenue: 0,
            canceled: 0,
            costs: 0
        }));

        const yearData = yearLabels.map(item => ({
            name: item.label,
            key: item.key,
            orders: 0,
            revenue: 0,
            canceled: 0,
            costs: 0
        }));

        const statusCounter = {
            'pedido-recebido': 0,
            'pedido-em-producao': 0,
            'saiu-para-entrega': 0,
            'completo': 0,
            'cancelado': 0
        };

        allOrders.forEach(order => {
            if (!order.createdAt) return;
            const orderDate = new Date(order.createdAt);
            if (isNaN(orderDate.getTime())) return;

            const orderValue = order.itens.reduce((total, item) => total + item.subTotal, 0);
            const orderCostTotal = order.itens.reduce((total, item) => total + item.precoCusto, 0);
            const orderCost = order.itens.reduce((total, item) => total + item.precoCusto, 0); // Soma direta dos custos

            //mapeando os status
            let statusKey;
            switch (order.status) {
                case 0:
                    statusKey = 'pedido-recebido';
                    break;
                case 1:
                    statusKey = 'pedido-em-producao';
                    break;
                case 2:
                    statusKey = 'saiu-para-entrega';
                    break;
                case 3:
                    statusKey = 'completo';
                    break;
                case 4:
                    statusKey = 'cancelado';
                    break;
                default:
                    statusKey = 'pedido-recebido';
            }

            statusCounter[statusKey]++;

            // Weekly data
            const weekKey = orderDate.toISOString().split('T')[0];
            const weekIndex = weekData.findIndex(d => d.key === weekKey);
            if (weekIndex >= 0) {
                weekData[weekIndex].orders += 1;
                weekData[weekIndex].revenue += orderValue;
                weekData[weekIndex].costs += orderCost; // Corrigido
                if (statusKey === 'Cancelado') {
                    weekData[weekIndex].canceled += 1;
                }
            }

            // Agrupamento mensal
            const startOfGroup = new Date(orderDate);
            startOfGroup.setDate(orderDate.getDate() - (orderDate.getDate() % 1));
            const monthKey = startOfGroup.toISOString().split('T')[0];
            const monthIndex = monthData.findIndex(d => d.key === monthKey);
            if (monthIndex >= 0) {
                monthData[monthIndex].orders += 1;
                monthData[monthIndex].revenue += orderValue;
                monthData[monthIndex].costs += orderCost; 
                if (statusKey === 'Cancelado') {
                    monthData[monthIndex].canceled += 1;
                }
            }

            //Por ano
            const yearKey = orderDate.toISOString().substring(0, 7);
            const yearIndex = yearData.findIndex(d => d.key === yearKey);
            // Yearly data
            if (yearIndex >= 0) {
                yearData[yearIndex].orders += 1;
                yearData[yearIndex].revenue += orderValue;
                yearData[yearIndex].costs += orderCost;
                if (statusKey === 'Cancelado') {
                    yearData[yearIndex].canceled += 1;
                }
            }
        });

        //Distribuicao de status usando o mapeamento
        const statusDistribution = [
            { name: 'Recebido', value: statusCounter['pedido-recebido'], color: '#3B82F6' },
            { name: 'Em Produção', value: statusCounter['pedido-em-producao'], color: '#F59E0B' },
            { name: 'Em Entrega', value: statusCounter['saiu-para-entrega'], color: '#8B5CF6' },
            { name: 'Completo', value: statusCounter['completo'], color: '#10B981' },
            { name: 'Cancelado', value: statusCounter['cancelado'], color: '#EF4444' }
        ].filter(item => item.value > 0);

        return {
            weekData: weekData.map(d => ({ ...d, name: d.name, profit: d.revenue - d.costs })),
            monthData: monthData.map(d => ({ ...d, name: d.name, profit: d.revenue - d.costs })),
            yearData: yearData.map(d => ({ ...d, name: d.name, profit: d.revenue - d.costs })),
            statusDistribution
        };
    }, [allOrders]);
    //Seleciona os dados por base no mapeamento de data
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

    const data = getChartData();
    const calculateSummary = (data) => {
        return {
            totalOrders: data.reduce((sum, item) => sum + item.orders, 0),
            totalRevenue: data.reduce((sum, item) => sum + item.revenue, 0),
            totalCanceled: data.reduce((sum, item) => sum + item.canceled, 0),
            totalCosts: data.reduce((sum, item) => sum + item.costs, 0),
            profit: data.reduce((sum, item) => sum + (item.revenue - item.costs), 0),
        };
    };

    const summary = calculateSummary(data);
    const colors = {
        orders: '#3B82F6',
        revenue: '#10B981',
        canceled: '#EF4444',
        costs: '#8B5CF6',
        profit: '#F59E0B'
    };

    const renderChart = () => {
        if (!data.length) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    <h1 className="text-2xl font-semibold text-gray-700">Procurando pedidos, aguarde.</h1>
                </div>
            );
        }
        switch (chartType) {
            case 'overview':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip formatter={(value, name) => {
                                if (name === 'revenue' || name === 'costs' || name === 'profit') {
                                    return [`R$ ${value.toFixed(2)}`, name === 'revenue' ? 'Receita' : name === 'costs' ? 'Custos' : 'Lucro'];
                                }
                                return [value, name === 'orders' ? 'Pedidos' : 'Cancelados'];
                            }} />
                            <Legend formatter={(value) => {
                                switch (value) {
                                    case 'orders': return 'Pedidos';
                                    case 'revenue': return 'Receita (R$)';
                                    default: return value;
                                }
                            }} />
                            <Area
                                type="monotone"
                                dataKey="orders"
                                name="orders"
                                stroke={colors.orders}
                                fill={colors.orders}
                                fillOpacity={0.3}
                                yAxisId="left"
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="revenue"
                                stroke={colors.revenue}
                                fill={colors.revenue}
                                fillOpacity={0.3}
                                yAxisId="right"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'finance':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value, name) => {
                                if (name === 'revenue' || name === 'costs' || name === 'profit') {
                                    return [`R$ ${value.toFixed(2)}`, name === 'revenue' ? 'Receita' : name === 'costs' ? 'Custos' : 'Lucro'];
                                }
                                return [value, name];
                            }} />
                            <Legend formatter={(value) => {
                                switch (value) {
                                    case 'revenue': return 'Receita';
                                    case 'costs': return 'Custos';
                                    case 'profit': return 'Lucro';
                                    default: return value;
                                }
                            }} />
                            <Bar dataKey="revenue" name="revenue" fill={colors.revenue} />
                            <Bar dataKey="costs" name="costs" fill={colors.costs} />
                            <Bar dataKey="profit" name="profit" fill={colors.profit} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'orders':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value, name) => [value, name === 'orders' ? 'Pedidos' : 'Cancelados']} />
                            <Legend formatter={(value) => value === 'orders' ? 'Pedidos' : 'Cancelados'} />
                            <Line
                                type="monotone"
                                dataKey="orders"
                                name="orders"
                                stroke={colors.orders}
                                activeDot={{ r: 8 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="canceled"
                                name="canceled"
                                stroke={colors.canceled}
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
                                fill="#8884d8"
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
        : 0;

    // Calculate cancellation rate
    const cancellationRate = summary.totalOrders > 0
        ? ((summary.totalCanceled / summary.totalOrders) * 100).toFixed(1)
        : 0;

    // Calculate average order value
    const averageOrderValue = summary.totalOrders > 0
        ? (summary.totalRevenue / summary.totalOrders).toFixed(2)
        : 0;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-3 md:mb-0">Análise de Pedidos</h2>

                {/* Chart type selector */}
                <div className="flex space-x-2 mb-4 md:mb-0">
                    <button
                        onClick={() => setChartType('overview')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md ${chartType === 'overview' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        <BarChart4 size={18} />
                        <span>Visão Geral</span>
                    </button>
                    <button
                        onClick={() => setChartType('finance')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md ${chartType === 'finance' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        <DollarSign size={18} />
                        <span>Financeiro</span>
                    </button>
                    <button
                        onClick={() => setChartType('orders')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md ${chartType === 'orders' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        <TrendingUp size={18} />
                        <span>Pedidos</span>
                    </button>
                    {/*<button
                        onClick={() => setChartType('status')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md ${chartType === 'status' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        <PieIcon size={18} />
                        <span>Status</span>
                    </button>*/}
                </div>

                {/* Time range selector */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => setTimeRange('week')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md ${timeRange === 'week' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        <Calendar size={18} />
                        <span>Semana</span>
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md ${timeRange === 'month' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        <Calendar size={18} />
                        <span>Mês</span>
                    </button>
                    <button
                        onClick={() => setTimeRange('year')}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md ${timeRange === 'year' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        <Calendar size={18} />
                        <span>Ano</span>
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-blue-600 text-sm mb-1">Total de Pedidos</div>
                    <div className="text-2xl font-bold text-gray-800">{summary.totalOrders}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-green-600 text-sm mb-1">Receita Total</div>
                    <div className="text-2xl font-bold text-gray-800">R$ {summary.totalRevenue.toFixed(2)}</div>
                </div>
                {/*<div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-red-600 text-sm mb-1">Pedidos Cancelados</div>
                    <div className="text-2xl font-bold text-gray-800">{summary.totalCanceled}</div>
                </div>*/}
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-purple-600 text-sm mb-1">Custos Totais</div>
                    <div className="text-2xl font-bold text-gray-800">R$ {summary.totalCosts.toFixed(2)}</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="text-amber-600 text-sm mb-1">Lucro Total</div>
                    <div className="text-2xl font-bold text-gray-800">R$ {summary.profit.toFixed(2)}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
                {renderChart()}
            </div>

            {/* Insights section */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-700">Períodos de Pico</h4>
                        <p className="text-gray-600 mt-1">
                            {data.length > 0
                                ? `Dia com mais pedidos: ${data.reduce((max, item) => item.orders > max.orders ? item : max, data[0]).name} (${data.reduce((max, item) => item.orders > max.orders ? item : max, data[0]).orders} pedidos)`
                                : 'Sem dados suficientes para análise de pico'}
                        </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-700">Margem de Lucro</h4>
                        <p className="text-gray-600 mt-1">
                            Sua margem de lucro média é de {profitMargin}%, {Number(profitMargin) > 30 ? 'acima' : 'abaixo'} da média do setor.
                        </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-700">Taxa de Cancelamento</h4>
                        <p className="text-gray-600 mt-1">
                            Sua taxa de cancelamento é de {cancellationRate}%, {Number(cancellationRate) < 5 ? 'menor' : 'maior'} que a média do setor.
                        </p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                        <h4 className="font-medium text-amber-700">Valor Médio do Pedido</h4>
                        <p className="text-gray-600 mt-1">
                            O valor médio por pedido é R$ {averageOrderValue}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderAnalyticsDashboard;