import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Remover o token do localStorage
        localStorage.removeItem('token');

        // Remover o token dos cabeçalhos do Axios
        delete axios.defaults.headers.common['Authorization'];

        // Redirecionar para a página de login
        navigate('/auth/login', { replace: true });
    }, [navigate]);

    return <p>Você foi deslogado. Redirecionando...</p>;
};

export default Logout;
