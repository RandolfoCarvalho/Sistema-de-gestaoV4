import React, { useEffect }  from 'react';
import useOrders from './hooks/useOrders';
import useSignalRListeners from './hooks/useSignalRListeners';
import StatusColumn from './components/StatusColumn';
import statusConfig from './components/StatusConfig';
import { useSignalR } from '../../../services/SignalRContext';
import { FaClipboardList, FaCheckCircle, FaTimesCircle, FaCog, FaTruck, FaPlusCircle, FaDollarSign, FaBox, FaCalendarDay } from 'react-icons/fa';
import FluidMetricsCard from './components/FluidMetricsCard';
import OrderAnalyticsDashboard from './components/OrderAnalyticsDashboard';

const OrderDashboard = () => {
    const { connection, isConnected } = useSignalR();
    const { orders, setOrders, fetchOrders, processOrders } = useOrders();

    // Usar o hook diretamente, passando todos os parâmetros necessários
    useSignalRListeners(connection, isConnected, setOrders, processOrders, fetchOrders);


    const handleOrderDrop = async (order, newStatus) => {
        // Mapear o status do frontend para o valor numérico do backend
        const statusMap = {
            'pedido-recebido': 0,    // NOVO
            'pedido-em-producao': 1, // 
            'saiu-para-entrega': 2,  // EM_ENTREGA
            'completo': 3,           // COMPLETO
            'Cancelado': 4            // CANCELADO
        };

        const numericStatus = statusMap[newStatus];
        if (numericStatus !== undefined && connection && isConnected) {
            try {
                console.log(`Atualizando pedido ${order.id} para status ${newStatus} (${numericStatus})`);

                // Enviar atualização para o backend
                await connection.invoke("UpdateOrderStatus", order.id, numericStatus);
                console.log(`Pedido ${order.id} enviado para atualização. Aguardando resposta do servidor...`);
            } catch (error) {
                console.error("Erro ao atualizar status do pedido:", error);
            }
        }
    };

    useEffect(() => {
        if (connection && isConnected) {
            fetchOrders(connection, isConnected);
        }
    }, [connection, isConnected, fetchOrders]);

    return (
        <div className="p-6 max-w-full bg-gray-50">
            <div className="mb-6">
                <OrderAnalyticsDashboard orders={orders} />
            </div>
           
            {/* Status Columns */}
            <div className="flex flex-wrap gap-6 pb-4">
                {Object.entries(statusConfig).map(([status, config]) => (
                    <StatusColumn
                        key={status}
                        id={status}
                        title={config.title}
                        orders={orders[status] || []}
                        config={config}
                        onDrop={handleOrderDrop}
                    />
                ))}
            </div>
        </div>
    );
};

export default OrderDashboard;
