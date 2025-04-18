import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Criação do contexto
export const UserContext = createContext();

// Provedor do contexto
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/GetRestauranteInfo`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setUser(response.data); // Aqui você recebe as informações do usuário
            } catch (error) {
                console.error('Erro ao buscar informações do usuário:', error);
            } finally {
                setLoading(false); // Finaliza o carregamento
            }
        };

        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading }}>
            {children}
        </UserContext.Provider>
    );
};
