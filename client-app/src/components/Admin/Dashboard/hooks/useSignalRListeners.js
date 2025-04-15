import { useEffect } from 'react';

// Definir a função do hook
const useSignalRListeners = (connection, isConnected, setOrders, processOrders, fetchOrders) => {
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

        connection.on("ReceiveError", (errorMessage) => {
            console.error("Erro recebido do servidor:", errorMessage);
        });

        return () => {
            connection.off("ReceiveAllOrders");
            connection.off("ReceiveOrderUpdate");
            connection.off("ReceiveError");
        };
    }, [connection, isConnected, setOrders, processOrders, fetchOrders]);
};
export default useSignalRListeners;