import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const useOrders = () => {
    const [orders, setOrders] = useState({
        'pedido-recebido': [],
        'pedido-em-producao': [],
        'saiu-para-entrega': [],
        'completo': [],
        'Cancelado': []
    });

    const processOrders = useCallback((data) => {
        if (!Array.isArray(data) || !data.length) return {
            'pedido-recebido': [],
            'pedido-em-producao': [],
            'saiu-para-entrega': [],
            'completo': [],
            'Cancelado' : []
        };
    
        const processedOrders = {
            'pedido-recebido': [],
            'pedido-em-producao': [],
            'saiu-para-entrega': [],
            'completo': [],
            'Cancelado': []
        };
        
        data.forEach(order => {
            console.log(`Pedido ID: ${order.id}, Status: ${order.status}`);
            let statusKey;
            let statusValue = order.status;
            if (typeof statusValue === 'string') {
                switch (statusValue) {
                    case "NOVO": statusValue = 0; break;
                    case "EM_PRODUCAO": statusValue = 1; break;
                    case "EM_ENTREGA": statusValue = 2; break;
                    case "COMPLETO": statusValue = 3; break;
                    case "CANCELADO": statusValue = 4; break;
                }
            }
            //mapeia valores numeros para o front end
            switch (Number(statusValue)) {
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
                    statusKey = 'Cancelado';
                    break;
                default:
                    console.warn(`Status desconhecido: ${order.status} (${statusValue})`);
                    statusKey = 'pedido-recebido'; // Fallback
            }
    
            if (processedOrders[statusKey]) {
                processedOrders[statusKey].push(order);
            } else {
                console.warn(`Categoria de status não encontrada para o pedido: ${order.id} com status ${order.status}`);
            }
        });
    
        console.log("Pedidos processados por status:", processedOrders);
        return processedOrders;
    }, []);

    const fetchOrders = useCallback(async (connection, isConnected) => {
        if (!connection || !isConnected) return;

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/ObterRestauranteIdDoUsuarioAutenticado/`);
            const restauranteId = response.data;
            await connection.invoke("RequestAllOrders", restauranteId);

        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
        }
    }, []);
    return { orders, setOrders, fetchOrders, processOrders };
};

export default useOrders;
