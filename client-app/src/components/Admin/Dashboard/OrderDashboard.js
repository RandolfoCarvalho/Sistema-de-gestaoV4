import React, { useEffect } from 'react';
import useOrderStore from '../../../stores/orderStore';
import { useSignalR } from '../../../services/SignalRContext';
import useSignalRListeners from './hooks/useSignalRListeners';

//UI
import StatusColumn from './components/StatusColumn';
import statusConfig from './components/StatusConfig';
import OrderAnalyticsDashboard from './components/OrderAnalyticsDashboard';

const OrderDashboard = () => {
    // A conexão SignalR continua sendo gerenciada pelo contexto, o que está correto.
    const { connection, isConnected, setNotification } = useSignalR();
    //estados do zustand que preciso ficar sabendo
    const kanbanOrders = useOrderStore(state => state.kanbanOrders);
    const isLoading = useOrderStore(state => state.isLoading);
    const fetchInitialOrders = useOrderStore(state => state.fetchInitialOrders);
    const updateOrderStatus = useOrderStore(state => state.updateOrderStatus);

    // =================================================================================
    // CONFIGURAÇÃO DOS LISTENERS E EFEITOS
    // =================================================================================
    // O hook de listeners agora é mais simples, pois interage diretamente com o store.
    useSignalRListeners(connection, isConnected, setNotification);

    // Efeito para buscar os dados iniciais assim que a conexão estiver pronta.
    useEffect(() => {
        if (connection && isConnected) {
            fetchInitialOrders(connection);
        }
    }, [connection, isConnected, fetchInitialOrders]);


    // =================================================================================
    // HANDLERS DE INTERAÇÃO DO USUÁRIO
    // =================================================================================
    const handleOrderDrop = async (order, newStatusStringKey) => {
        await updateOrderStatus(connection, order, newStatusStringKey);
    };
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-lg text-gray-600">Carregando painel de pedidos...</p>
            </div>
        );
    }
    return (
        <div className="p-4 sm:p-6 max-w-full bg-gray-50 min-h-screen">
            <div className="mb-6">
                <OrderAnalyticsDashboard />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 pb-4 overflow-x-auto">
                {Object.entries(statusConfig).map(([statusKeyFromConfig, config]) => (
                    <StatusColumn
                        key={statusKeyFromConfig}
                        id={statusKeyFromConfig}
                        title={config.title}
                        // Os pedidos já vêm processados e prontos do store!
                        orders={kanbanOrders[statusKeyFromConfig] || []}
                        config={config}
                        onDrop={handleOrderDrop}
                    />
                ))}
            </div>
        </div>
    );
};

export default OrderDashboard;