import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import FuturisticLoadingSpinner from './ui/FuturisticLoadingSpinner'; 

const ProtectedRoute = ({ redirectTo = "/auth/login" }) => {
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");

        const timer = setTimeout(() => {
            if (token) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                navigate(redirectTo, { replace: true });
            }
            setCheckingAuth(false); 
        }, 1300);

        return () => clearTimeout(timer);
    }, [navigate, redirectTo]);

    if (checkingAuth) {
        return (
            <FuturisticLoadingSpinner
                message="Carregando seus dados..."
                accentColor="blue"
                secondaryColor="blue"
                darkMode={false}
                showBorder={true}
                phaseMessages={["Preparando ambiente", "Carregando dados", "Verificando sistema", "Finalizando..."]}
                />
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
