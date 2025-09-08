import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import FuturisticLoadingSpinner from './ui/FuturisticLoadingSpinner';

const ProtectedRoute = ({ redirectTo = "/auth/login" }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) {
        return (
            <FuturisticLoadingSpinner
                message="Verificando sua identidade..."
                phaseMessages={["Conectando ao servidor", "Validando credenciais", "Quase lá..."]}
            />
        );
    }
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }
    return <Outlet />;
};

export default ProtectedRoute;