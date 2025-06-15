import { useEffect } from 'react';

// Definir a função do hook
const useSignalRListeners = (connection, isConnected, setOrders, processOrders, fetchOrders, setNotification) => {
    useEffect(() => {
        if (!connection || !isConnected) return;
        // Listener para receber todos os pedidos
        connection.on("ReceiveAllOrders", (data) => {
            console.log("Pedidos recebidos:", data);
            const processed = processOrders(data);
            setOrders(processed);
        });

        // Listener para receber atualização de um pedido específico
        connection.on("ReceiveOrderUpdate", (updatedOrder) => {
            console.log("Pedido atualizado recebido:", updatedOrder);
            fetchOrders(connection, isConnected);
        });
        
        //NOVO LISTENER PARA NOTIFICAÇÃO DE NOVO PEDIDO
        connection.on("ReceiveOrderNotification", (newOrder) => {
            console.log("✨ Novo pedido recebido em tempo real:", newOrder);

            // 1. Atualiza o estado da notificação no contexto
            if (setNotification) {
                setNotification(newOrder);
            }

            // 2. Adiciona o novo pedido ao estado do Kanban
            setOrders(prevOrders => {
                const newOrdersState = JSON.parse(JSON.stringify(prevOrders));
                const targetColumn = 'pedido-recebido';

                if (!newOrdersState[targetColumn]) {
                    newOrdersState[targetColumn] = [];
                }
                newOrdersState[targetColumn].unshift(newOrder);
                return newOrdersState;
            });
        });
        connection.on("ReceiveError", (errorMessage) => {
            console.error("Erro recebido do servidor:", errorMessage);
        });

        return () => {
            connection.off("ReceiveAllOrders");
            connection.off("ReceiveOrderUpdate");
            connection.off("ReceiveOrderNotification");
            connection.off("ReceiveError");
        };
    }, [connection, isConnected, setOrders, processOrders, fetchOrders]);
};
export default useSignalRListeners;