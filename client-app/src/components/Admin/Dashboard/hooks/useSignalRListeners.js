import { useEffect } from 'react';
import useOrderStore from '../../../../stores/orderStore'; 

const useSignalRListeners = (connection, isConnected, setNotification) => {
    const setRawOrders = useOrderStore(state => state.setRawOrders);
    const addNewOrder = useOrderStore(state => state.addNewOrder);
    const updateOrder = useOrderStore(state => state.updateOrder);

    useEffect(() => {
        if (!connection || !isConnected) return;

        connection.on("ReceiveAllOrders", (data) => {
            setRawOrders(data);
        });

        connection.on("ReceiveOrderUpdate", (updatedOrder) => {
            updateOrder(updatedOrder);
        });
        
        connection.on("ReceiveOrderNotification", (newOrder) => {
            if (setNotification) {
                setNotification(newOrder);
            }
            addNewOrder(newOrder);
        });

        connection.on("ReceiveError", (errorMessage) => {
            console.error("Erro recebido do servidor SignalR:", errorMessage);
        });

        return () => {
            connection.off("ReceiveAllOrders");
            connection.off("ReceiveOrderUpdate");
            connection.off("ReceiveOrderNotification");
            connection.off("ReceiveError");
        };
    }, [connection, isConnected, setRawOrders, addNewOrder, updateOrder, setNotification]);
};

export default useSignalRListeners;