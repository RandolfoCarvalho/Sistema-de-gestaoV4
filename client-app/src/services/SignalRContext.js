// SignalRContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';

const SignalRContext = createContext();

export const SignalRProvider = ({ children }) => {
    const [connection, setConnection] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            //.withUrl("http://localhost:5000/orderHub")
            .withUrl("https://api.fomedique.com.br/orderHub")
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        newConnection.onclose(() => {
            setIsConnected(false);
        });

        newConnection.onreconnecting(() => {
            setIsConnected(false);
        });

        newConnection.onreconnected(() => {
            setIsConnected(true);
        });

        const startConnection = async () => {
            try {
                await newConnection.start();
                setConnection(newConnection);
                setIsConnected(true);
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
        <SignalRContext.Provider value={{ connection, isConnected, notification, setNotification }}>
            {children}
        </SignalRContext.Provider>
    );
};
const useSignalR = () => useContext(SignalRContext);

export { useSignalR };

export default SignalRProvider;
