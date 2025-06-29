import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import FuturisticLoadingSpinner from './ui/FuturisticLoadingSpinner';
import { useAuth } from '../services/AuthContext';

const ProtectedRoute = ({ redirectTo = "/auth/login" }) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    React.useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, loading, navigate, redirectTo]);

    if (loading) {
        return (
            <FuturisticLoadingSpinner
                message="Verificando autenticação..."
                accentColor="blue"
                secondaryColor="blue"
                darkMode={false}
                showBorder={true}
                phaseMessages={["Preparando ambiente", "Carregando dados", "Verificando sistema", "Finalizando..."]}
            />
        );
    }
    return isAuthenticated ? <Outlet /> : null;
};

export default ProtectedRoute;