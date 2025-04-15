import React, { useState } from 'react';
import { Search, BarChart2, Bell } from 'lucide-react';
import MetricsCard from './FluidMetricsCard';
import StatusColumn from './StatusColumn';
import useOrders from '../hooks/useOrders';
import { useSignalRListeners } from '../hooks/useSignalRListeners';
import { useSignalR } from '../../services/SignalRContext';

const OrderManagementPanel = () => {
    const { connection, isConnected } = useSignalR();
    const { orders, setOrders, fetchOrders } = useOrders();
    const [searchTerm, setSearchTerm] = useState('');
    const [showMetrics, setShowMetrics] = useState(true);

    useSignalRListeners(connection, isConnected, setOrders);

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gerenciamento de Pedidos</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowMetrics(!showMetrics)} className="p-2 border rounded-lg">
                        <BarChart2 size={18} />
                        {showMetrics ? 'Ocultar Métricas' : 'Mostrar Métricas'}
                    </button>
                    <button className="p-2 border rounded-lg">
                        <Bell size={18} />
                    </button>
                </div>
            </div>

            {showMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <MetricsCard title="Total de Pedidos" value={orders.length} trend={+12} description="Últimas 24 horas" />
                    <MetricsCard title="Receita Total" value="R$ 10.000" trend={+8} description="Comparado a ontem" />
                    <MetricsCard title="Média por Pedido" value="R$ 50,00" trend={-3} description="Valor médio dos pedidos" />
                </div>
            )}

            <div className="mb-4 flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar pedidos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg"
                    />
                </div>
            </div>

            <div className="flex space-x-4 overflow-x-auto pb-4">
                {Object.entries(orders).map(([status, orderList]) => (
                    <StatusColumn key={status} id={status} title={status} orders={orderList} config={{}} onDrop={() => { }} />
                ))}
            </div>
        </div>
    );
};

export default OrderManagementPanel;
