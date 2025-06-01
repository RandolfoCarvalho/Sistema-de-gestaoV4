import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useOrders from './hooks/useOrders';
import useSignalRListeners from './hooks/useSignalRListeners';
import StatusColumn from './components/StatusColumn';
import statusConfig from './components/StatusConfig';
import { useSignalR } from '../../../services/SignalRContext';
import OrderAnalyticsDashboard from './components/OrderAnalyticsDashboard';

const OrderDashboard = () => {
    const { connection, isConnected } = useSignalR();
    const { orders, setOrders, fetchOrders, processOrders } = useOrders();

    const [activeFilters, setActiveFilters] = useState({
        searchTerm: '',
        startDate: null,
        endDate: null,
    });

    const handleFiltersChange = useCallback((newFilters) => {
        setActiveFilters(newFilters);
    }, []);

    useSignalRListeners(connection, isConnected, setOrders, processOrders, fetchOrders);

    const handleOrderDrop = async (order, newStatusStringKey) => {
        const columnKeyToBackendNumericStatus = {
            'pedido-recebido': 0,
            'pedido-em-producao': 1,
            'saiu-para-entrega': 2,
            'completo': 3,
            'Cancelado': 4
        };
        const numericStatus = columnKeyToBackendNumericStatus[newStatusStringKey];
        if (numericStatus !== undefined && connection && isConnected) {
            try {
                await connection.invoke("UpdateOrderStatus", order.id, numericStatus);
            } catch (error) {
                console.error("Erro ao atualizar status do pedido:", error);
            }
        } else {
            console.warn(`Mapeamento de status não encontrado para ${newStatusStringKey} em handleOrderDrop`);
        }
    };

    useEffect(() => {
        if (connection && isConnected) {
            fetchOrders(connection, isConnected);
        }
    }, [connection, isConnected, fetchOrders]);


    
    const filteredOrdersForKanban = useMemo(() => {
        const { searchTerm, startDate, endDate } = activeFilters;

        if ((!orders || Object.keys(orders).length === 0) && !searchTerm && !startDate && !endDate) {
            const emptyGrouped = {};
            Object.keys(statusConfig).forEach(statusKey => { emptyGrouped[statusKey] = []; });
            return emptyGrouped;
        }
        
        let allFlatOrders = Object.values(orders || {}).flat().map(order => ({
            ...order,
            createdAt: order.dataPedido || order.createdAt,
        }));

        if (searchTerm && searchTerm.trim() !== '') {
            const lowerSearchTerm = searchTerm.toLowerCase();
            allFlatOrders = allFlatOrders.filter(order =>
                (order.finalUserName?.toLowerCase().includes(lowerSearchTerm)) ||
                (order.numero?.toString().toLowerCase().includes(lowerSearchTerm))
            );
        }

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

        const groupedFilteredOrders = {};
        Object.keys(statusConfig).forEach(statusKeyFromConfig => {
            groupedFilteredOrders[statusKeyFromConfig] = [];
        });

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

        allFlatOrders.forEach(order => {
            let targetColumnKey = null;
            const orderStatusValue = order.status;

            if (typeof orderStatusValue === 'string' && backendStringEnumToColumnKey.hasOwnProperty(orderStatusValue)) {
                targetColumnKey = backendStringEnumToColumnKey[orderStatusValue];
            } else if (typeof orderStatusValue === 'number' || (typeof orderStatusValue === 'string' && /^\d+$/.test(orderStatusValue))) {
                const numericStatus = parseInt(orderStatusValue);
                targetColumnKey = numericBackendToColumnKey[numericStatus];
            } else if (typeof orderStatusValue === 'string') {
                const directMatchKey = Object.keys(statusConfig).find(
                    scKey => scKey.toLowerCase() === orderStatusValue.toLowerCase()
                );
                if (directMatchKey) {
                    targetColumnKey = directMatchKey;
                }
            }

            if (targetColumnKey && groupedFilteredOrders.hasOwnProperty(targetColumnKey)) {
                groupedFilteredOrders[targetColumnKey].push(order);
            } else {
                console.warn(
                    `KANBAN: Pedido ID ${order.id}, Status Original: "${orderStatusValue}" (tipo: ${typeof orderStatusValue}), `,
                    `Chave de Coluna Tentada: "${targetColumnKey}". Não foi possível alocar a uma coluna. `,
                    `Colunas disponíveis em statusConfig: ${Object.keys(statusConfig).join(', ')}`
                );
            }
        });
        
        return groupedFilteredOrders;

    }, [orders, activeFilters, statusConfig]);

    return (
        <div className="p-4 sm:p-6 max-w-full bg-gray-50 min-h-screen">
            <div className="mb-6">
                <OrderAnalyticsDashboard
                    orders={orders} 
                    onFiltersChange={handleFiltersChange}
                />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 pb-4 overflow-x-auto">
                {Object.entries(statusConfig).map(([statusKeyFromConfig, config]) => (
                    <StatusColumn
                        key={statusKeyFromConfig}
                        id={statusKeyFromConfig}
                        title={config.title}
                        orders={filteredOrdersForKanban[statusKeyFromConfig] || []}
                        config={config}
                        onDrop={handleOrderDrop}
                    />
                ))}
            </div>
        </div>
    );
};

export default OrderDashboard;