import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import LoadingSpinner from './ui/loadings'; 

const ProtectedRoute = ({ redirectTo = "/auth/login" }) => {
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsAuthenticated(true);
            setCheckingAuth(false);
        } else {
            setIsAuthenticated(false);
            setCheckingAuth(true);
            setTimeout(() => {
                navigate(redirectTo, { replace: true });
            }, 2000);
        }
    }, [navigate, redirectTo]);

    if (checkingAuth && !isAuthenticated) {
        return <LoadingSpinner message="Sessão expirada. Redirecionando para o login..." />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
