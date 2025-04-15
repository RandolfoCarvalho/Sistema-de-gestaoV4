// useSignalRPedidos.js
import { useEffect } from 'react';
import * as signalR from '@microsoft/signalr';

function useSignalRPedidos(onPedidoRecebido) {
    useEffect(() => {
        if (!onPedidoRecebido || typeof onPedidoRecebido !== "function") {
            console.warn("Você precisa passar uma função para onPedidoRecebido.");
            return;
        }

        // Create the connection
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("/orderHub")
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        // Set up the event handler
        connection.on("ReceiveOrderNotification", (pedidoDTO) => {
            onPedidoRecebido(pedidoDTO);
        });

        // Start the connection
        connection.start()
            .then(() => console.log("✅ Conectado ao OrderHub via SignalR"))
            .catch((err) => console.error("❌ Falha ao conectar no SignalR:", err));

        // Clean up function to stop the connection when component unmounts
        return () => {
            if (connection.state === signalR.HubConnectionState.Connected) {
                connection.stop()
                    .then(() => console.log("SignalR connection stopped"))
                    .catch((err) => console.error("Error stopping SignalR connection:", err));
            }
        };
    }, [onPedidoRecebido]); // Re-run if the callback changes
}

export default useSignalRPedidos;