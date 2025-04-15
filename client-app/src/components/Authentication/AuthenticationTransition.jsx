import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthenticationTransition = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
            setTimeout(() => navigate("/admin"), 2000);
        }, 2000);
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-700">Autenticado com sucesso!</h1>
                <p className="text-gray-500 mt-2">Redirecionando...</p>
            </div>
        </div>
    );
};


export default AuthenticationTransition;
