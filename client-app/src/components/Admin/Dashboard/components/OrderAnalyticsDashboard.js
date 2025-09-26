import React, { useState, useMemo } from 'react';
import useOrderStore from '../../../../stores/orderStore';
import { useSignalR } from '../../../../services/SignalRContext';

// UI
import NotificationToast from '../../ui/NotificationToast';
import RelatorioModal from '../../../Modals/RelatorioModal';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FileText, Calendar, BarChart4, TrendingUp, PieChart as PieIconLucide, DollarSign, Bell  } from 'lucide-react'; 

const OrderAnalyticsDashboard = () => {
    //Controle de UI
    const [timeRange, setTimeRange] = useState('week');
    const [chartType, setChartType] = useState('overview');
    const [isChartVisible, setIsChartVisible] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    //Store (zustand)
    const analyticsData = useOrderStore(state => state.analyticsData);
    const filters = useOrderStore(state => state.filters);
    const setFilters = useOrderStore(state => state.setFilters);

    // O estado da notificação ainda pode vir do SignalRContext
    const { notification, setNotification } = useSignalR();

   //dados para os gráficos (que vem do zustand)
    const currentChartData = useMemo(() => {
        switch (timeRange) {
            case 'week':
                return analyticsData.weekData || [];
            case 'month':
                return analyticsData.monthData || [];
            case 'year':
                return analyticsData.yearData || [];
            default:
                return analyticsData.weekData || [];
        }
    }, [timeRange, analyticsData]);

    const summary = analyticsData.summary || { totalOrders: 0, totalRevenue: 0, totalCanceled: 0, totalCosts: 0, profit: 0 };
    const chartColors = useMemo(() => ({
        orders: '#3B82F6',
        revenue: '#10B981',
        canceled: '#EF4444',
        costs: '#8B5CF6',
        profit: '#F59E0B'
    }), []);
    
    // =================================================================================
    // LÓGICA DE RENDERIZAÇÃO E CÁLCULOS DERIVADOS
    // =================================================================================
    const renderChart = () => {
        const dataForChart = chartType === 'status' ? analyticsData.statusDistribution : currentChartData;
        
        if (!dataForChart || dataForChart.length === 0) {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-gray-500">
                     <PieIconLucide size={48} className="mb-4" /> 
                    <p className="text-lg">Sem dados para exibir no período selecionado.</p>
                </div>
            );
        }
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
                                const valueName = String(name);
                                if (['revenue', 'costs', 'profit'].includes(valueName)) {
                                    return [`R$ ${Number(value).toFixed(2)}`, valueName === 'revenue' ? 'Receita' : valueName === 'costs' ? 'Custos' : 'Lucro'];
                                }
                                return [value, valueName === 'orders' ? 'Pedidos' : 'Cancelados'];
                            }} />
                            <Legend formatter={value => ({ orders: 'Pedidos', revenue: 'Receita (R$)', costs: 'Custos (R$)', profit: 'Lucro (R$)' }[value] || value)} />
                            <Area type="monotone" dataKey="orders" name="orders" stroke={chartColors.orders} fill={chartColors.orders} fillOpacity={0.3} yAxisId="left" />
                            <Area type="monotone" dataKey="revenue" name="revenue" stroke={chartColors.revenue} fill={chartColors.revenue} fillOpacity={0.3} yAxisId="right" />
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
                            <Tooltip formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, { revenue: 'Receita', costs: 'Custos', profit: 'Lucro' }[name] || name]} />
                            <Legend formatter={value => ({ revenue: 'Receita', costs: 'Custos', profit: 'Lucro' }[value] || value)} />
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
                            <Tooltip formatter={(value, name) => [value, name === 'orders' ? 'Pedidos' : 'Cancelados']} />
                            <Legend formatter={value => (value === 'orders' ? 'Pedidos' : 'Cancelados')} />
                            <Line type="monotone" dataKey="orders" name="orders" stroke={chartColors.orders} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="canceled" name="canceled" stroke={chartColors.canceled} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'status':
                return (
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <Pie
                                data={analyticsData.statusDistribution}
                                cx="50%" cy="50%" labelLine={false} outerRadius={150} fill="#8884d8"
                                dataKey="value" nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {analyticsData.statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(value, name) => [value, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    // Cálculos de insights (permanecem os mesmos, mas usam os dados do store)
    const profitMargin = summary.totalRevenue > 0 ? ((summary.profit / summary.totalRevenue) * 100).toFixed(1) : "0.0";
    const cancellationRate = summary.totalOrders > 0 ? ((summary.totalCanceled / summary.totalOrders) * 100).toFixed(1) : "0.0";
    const averageOrderValue = summary.totalOrders > 0 ? (summary.totalRevenue / summary.totalOrders).toFixed(2) : "0.00";
    const peakDayInfo = useMemo(() => {
        if (!currentChartData || currentChartData.length === 0) return { name: 'N/A', orders: 0 };
        return currentChartData.reduce((max, item) => (item.orders > max.orders ? item : max), { orders: 0 });
    }, [currentChartData]);

    return (
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            {notification && <NotificationToast order={notification} onClose={() => setNotification(null)} />}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">Análise Detalhada de Pedidos</h3>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsChartVisible(!isChartVisible)} className="text-sm text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50">
                        {isChartVisible ? 'Minimizar Gráficos ▲' : 'Expandir Gráficos ▼'}
                    </button>
                    <button className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full">
                        <Bell size={20} />
                        {notification && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>}
                    </button>
                </div>
            </div>

            {/* A SEÇÃO DE FILTROS AGORA INTERAGE COM O STORE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border border-gray-200 rounded-lg">
                <div>
                    <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">Pesquisar Pedido</label>
                    <input
                        type="text" id="searchTerm" placeholder="Nº pedido..."
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={filters.searchTerm}
                        onChange={(e) => setFilters({ searchTerm: e.target.value })} // Chama a ação do store (zustand)
                    />
                </div>
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                    <input
                        type="date" id="startDate"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={filters.startDate || ''}
                        onChange={(e) => setFilters({ startDate: e.target.value })} // Chama a ação do store (zustand)
                        max={filters.endDate || ''}
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                    <input
                        type="date" id="endDate"
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={filters.endDate || ''}
                        onChange={(e) => setFilters({ endDate: e.target.value })} // Chama a ação do store (zustand)
                        min={filters.startDate || ''}
                    />
                </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-wrap justify-center md:justify-start space-x-1 sm:space-x-2 mb-4 md:mb-0">
                    {[
                        { type: 'overview', label: 'Visão Geral', icon: BarChart4 },
                        { type: 'finance', label: 'Financeiro', icon: DollarSign },
                        { type: 'orders', label: 'Pedidos', icon: TrendingUp },
                        { type: 'status', label: 'Status', icon: PieIconLucide }
                    ].map(item => (
                        <button key={item.type} onClick={() => setChartType(item.type)} className={`flex items-center gap-2 px-2 py-2 sm:px-3 text-xs sm:text-sm rounded-md transition-colors ${chartType === item.type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            <item.icon size={16} /><span>{item.label}</span>
                        </button>
                    ))}
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow hover:bg-indigo-700">
                        <FileText size={18} /><span>Gerar Relatório</span>
                    </button>
                </div>
                <div className="flex flex-wrap justify-center md:justify-end space-x-1 sm:space-x-2">
                     {['week', 'month', 'year'].map(range => (
                        <button key={range} onClick={() => setTimeRange(range)} className={`flex items-center gap-2 px-2 py-2 sm:px-3 text-xs sm:text-sm rounded-md transition-colors ${timeRange === range ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            <Calendar size={16} /><span>{range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Ano'}</span>
                        </button>
                    ))}
                </div>
                <RelatorioModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg shadow"><div className="text-blue-600 text-sm font-medium mb-1">Total de Pedidos</div><div className="text-2xl font-bold text-gray-800">{summary.totalOrders}</div></div>
                <div className="bg-green-50 p-4 rounded-lg shadow"><div className="text-green-600 text-sm font-medium mb-1">Receita Total</div><div className="text-2xl font-bold text-gray-800">{`R$ ${summary.totalRevenue.toFixed(2)}`}</div></div>
                <div className="bg-purple-50 p-4 rounded-lg shadow"><div className="text-purple-600 text-sm font-medium mb-1">Custos Totais</div><div className="text-2xl font-bold text-gray-800">{`R$ ${summary.totalCosts.toFixed(2)}`}</div></div>
                <div className="bg-amber-50 p-4 rounded-lg shadow"><div className="text-amber-600 text-sm font-medium mb-1">Lucro Total</div><div className="text-2xl font-bold text-gray-800">{`R$ ${summary.profit.toFixed(2)}`}</div></div>
            </div>

            {isChartVisible && (
                <>
                    <div className="bg-gray-50 p-2 sm:p-4 rounded-lg shadow ">{renderChart()}</div>
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Insights Rápidos</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg shadow"><h4 className="font-medium text-blue-700">Período de Pico de Pedidos</h4><p className="text-gray-600 mt-1">{peakDayInfo.orders > 0 ? `${peakDayInfo.name} com ${peakDayInfo.orders} pedido(s).` : 'Sem dados suficientes para análise.'}</p></div>
                            <div className="bg-green-50 p-4 rounded-lg shadow"><h4 className="font-medium text-green-700">Margem de Lucro Média</h4><p className="text-gray-600 mt-1">Sua margem de lucro média é de {profitMargin}%. </p></div>
                            <div className="bg-red-50 p-4 rounded-lg shadow"><h4 className="font-medium text-red-700">Taxa de Cancelamento</h4><p className="text-gray-600 mt-1">Sua taxa de cancelamento é de {cancellationRate}%. </p></div>
                            <div className="bg-amber-50 p-4 rounded-lg shadow"><h4 className="font-medium text-amber-700">Valor Médio do Pedido</h4><p className="text-gray-600 mt-1">O valor médio por pedido é R$ {averageOrderValue}. </p></div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderAnalyticsDashboard;