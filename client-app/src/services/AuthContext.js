// src/services/AuthContext.js - VERSÃO MELHORADA

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios"; // Usar Axios é uma boa prática para consistência

// Crie um hook customizado para facilitar o uso
export const useAuth = () => {
  return useContext(AuthContext);
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Comece com `isAuthenticated` como false e `loading` como true.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        // Use a instância global do axios ou crie uma nova
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/auth/validateToken`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // A API de validação retornou sucesso (status 2xx)
        const data = res.data;
        if (data.valid) {
          setIsAuthenticated(true);
          setUser(data.user); // Armazena o nome do usuário vindo do backend
        } else {
          // O token é inválido mas a API não retornou erro (caso raro)
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        // A API retornou erro (401 Unauthorized, etc.), o que significa que o token é inválido.
        console.error("Falha na validação do token:", error);
        localStorage.removeItem("token"); // Limpa o token inválido
        setIsAuthenticated(false);
      } finally {
        // Independentemente do resultado, a verificação terminou.
        setLoading(false);
      }
    };

    validateToken();
  }, []); // O array vazio garante que isso rode apenas uma vez

  const value = {
    isAuthenticated,
    loading,
    user,
    setIsAuthenticated // Para a função de logout poder alterar o estado
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
