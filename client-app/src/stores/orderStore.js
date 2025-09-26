import { create } from 'zustand';
import { processOrdersForKanban, calculateAnalyticsData } from '../utils/orderUtils';
import api from '../axiosConfig'; 

const columnKeyToBackendNumericStatus = { 'pedido-recebido': 0, 'pedido-em-producao': 1, 'saiu-para-entrega': 2, 'completo': 3, 'Cancelado': 4 };
const useOrderStore = create((set, get) => ({
    rawOrders: [],
    filters: { searchTerm: '', startDate: null, endDate: null, },
    kanbanOrders: { 
        'pedido-recebido': [], 
        'pedido-em-producao': [], 
        'saiu-para-entrega': [], 
        'completo': [], 
        'Cancelado': [] 
    },
    analyticsData: {},
    isLoading: true,

    /**
     * Atualiza os filtros e recalcula os dados derivados EM UM ÚNICO PASSO.
     */
    setFilters: (newFilters) => {
        const { rawOrders } = get();
        const updatedFilters = { ...get().filters, ...newFilters };
        const newKanbanOrders = processOrdersForKanban(rawOrders, updatedFilters);
        const newAnalyticsData = calculateAnalyticsData(rawOrders, updatedFilters);
        set({
            filters: updatedFilters,
            kanbanOrders: newKanbanOrders,
            analyticsData: newAnalyticsData
        });
    },

    /**
     * Define a lista de pedidos "crus" e recalcula tudo EM UM ÚNICO PASSO.
     */
    setRawOrders: (orders) => {
        const { filters } = get();
        const newRawOrders = (Array.isArray(orders) ? orders : []).map(normalizeOrder);
        
        const newKanbanOrders = processOrdersForKanban(newRawOrders, filters);
        const newAnalyticsData = calculateAnalyticsData(newRawOrders, filters);
        set({
            rawOrders: newRawOrders,
            kanbanOrders: newKanbanOrders,
            analyticsData: newAnalyticsData,
            isLoading: false
        });
    },
    
    /**
     * Adiciona um novo pedido e recalcula tudo EM UM ÚNICO PASSO.
     */
    addNewOrder: (newOrder) => {
        const normalizedNewOrder = normalizeOrder(newOrder);
        const newRawOrders = [normalizedNewOrder, ...get().rawOrders];
        const { filters } = get();

        const newKanbanOrders = processOrdersForKanban(newRawOrders, filters);
        const newAnalyticsData = calculateAnalyticsData(newRawOrders, filters);
        set({
            rawOrders: newRawOrders,
            kanbanOrders: newKanbanOrders,
            analyticsData: newAnalyticsData
        });
    },

    updateOrder: (updatedOrderFromServer) => {
        const normalizedUpdate = normalizeOrder(updatedOrderFromServer);
        const newRawOrders = get().rawOrders.map(order => {
            if (order.id === normalizedUpdate.id) {
                return { ...order, ...normalizedUpdate };
            }
            return order;
        });

        const { filters } = get();
        const newKanbanOrders = processOrdersForKanban(newRawOrders, filters);
        const newAnalyticsData = calculateAnalyticsData(newRawOrders, filters);
        
        set({
            rawOrders: newRawOrders,
            kanbanOrders: newKanbanOrders,
            analyticsData: newAnalyticsData,
        });
    },

    // Ação para buscar os pedidos iniciais
    fetchInitialOrders: async (connection) => {
        if (!connection || connection.state !== 'Connected') return;
        set({ isLoading: true });
        try {
            const response = await api.order.getRestaurantId();
            const restauranteId = response.data;
            await connection.invoke("RequestAllOrders", restauranteId);
        } catch (error) {
            console.error("Erro ao solicitar pedidos:", error);
            set({ isLoading: false });
        }
    },

    // Ação para invocar a atualização de status no backend
    updateOrderStatus: async (connection, order, newStatusStringKey) => {
        const numericStatus = columnKeyToBackendNumericStatus[newStatusStringKey];
        if (numericStatus === undefined || !connection || connection.state !== 'Connected') return;

        try {
            await connection.invoke("UpdateOrderStatus", order.id, numericStatus);
        } catch (error) {
            console.error("Erro ao invocar UpdateOrderStatus:", error);
        }
    },
}));

/**
 * Função de normalização de dados.
 * Garante que o objeto do pedido sempre tenha um formato consistente,
 * não importa como ele venha do backend.
 * @param {object} order - O objeto do pedido a ser normalizado.
 * @returns {object} - O objeto do pedido com formato padronizado.
 */
const normalizeOrder = (order) => {
    if (!order) return null;

    // Normaliza os itens do pedido
    const normalizedItens = order.itens?.map(item => ({
        ...item,
        // Garante que a propriedade 'produtoNome' sempre exista,
        // usando 'nomeProduto' como fallback.
        produtoNome: item.produtoNome || item.nomeProduto, 
    })) || [];

    // Retorna uma nova versão do pedido com os itens normalizados
    return {
        ...order,
        itens: normalizedItens,
    };
};

export default useOrderStore;