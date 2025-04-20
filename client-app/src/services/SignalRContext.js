// SignalRContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
    const [connection, setConnection] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            //.withUrl("http://localhost:5049/orderHub")
            .withUrl("https://api.fomedique.com.br/orderHub")
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        newConnection.onclose(() => {
            setIsConnected(false);
            console.log('Connection closed');
        });

        newConnection.onreconnecting(() => {
            setIsConnected(false);
            console.log('Reconnecting...');
        });

        newConnection.onreconnected(() => {
            setIsConnected(true);
            console.log('Reconnected!');
        });

        const startConnection = async () => {
            try {
                await newConnection.start();
                setConnection(newConnection);
                setIsConnected(true);
                console.log("SignalR Connected!");
            } catch (err) {
                console.error("SignalR Connection Error: ", err);
                setTimeout(startConnection, 5000);
            }
        };

        startConnection();

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, []);

    return (
        <SignalRContext.Provider value={{ connection, isConnected }}>
            {children}
        </SignalRContext.Provider>
    );
};

// Hook para usar o SignalRContext
const useSignalR = () => useContext(SignalRContext);

// Certifique-se de que não há outras exportações para esses identificadores
export { useSignalR }; // Mantém a exportação apenas do hook

export default SignalRProvider; // Exportação padrão do provider
