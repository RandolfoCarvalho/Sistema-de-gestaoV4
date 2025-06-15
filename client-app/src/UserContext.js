// src/components/ProtectedRoute.js - VERSÃO CORRIGIDA E FINAL

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../services/AuthContext'; // Importe o hook customizado
import FuturisticLoadingSpinner from './ui/FuturisticLoadingSpinner';

const ProtectedRoute = ({ redirectTo = "/auth/login" }) => {
    // Consuma o contexto para obter o status de autenticação e carregamento
    const { isAuthenticated, loading } = useAuth();

    // 1. Enquanto a validação do token está em andamento, mostre um spinner
    if (loading) {
        return (
            <FuturisticLoadingSpinner
                message="Verificando sua identidade..."
                phaseMessages={["Conectando ao servidor", "Validando credenciais", "Quase lá..."]}
            />
        );
    }

    // 2. Após a verificação, se o usuário NÃO estiver autenticado, redirecione
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // 3. Se estiver autenticado, permita o acesso às rotas filhas
    return <Outlet />;
};

export default ProtectedRoute;