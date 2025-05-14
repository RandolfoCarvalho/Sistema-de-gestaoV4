import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import FuturisticLoadingSpinner from './ui/FuturisticLoadingSpinner'; 
import { useStore } from './Context/StoreContext';

const ProtectedRoute = ({ redirectTo = "/auth/login" }) => {
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const { currentStore } = useStore(); 

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
    /* if (!currentStore) {
            return (
                <div className="flex items-center justify-center h-screen bg-gray-100">
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                        <h2 className="text-2xl font-semibold text-red-500 mb-4">Loja não encontrada</h2>
                        <p className="text-gray-600">Por favor, acesse a loja por um link válido.</p>
                        <button
                            className="mt-6 bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => navigate('/')}
                        >
                            Voltar para o início
                        </button>
                    </div>
                </div>
            );
        } */

    return <Outlet />;
};

export default ProtectedRoute;
