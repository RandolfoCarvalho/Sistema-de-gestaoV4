import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        navigate('/auth/login', { replace: true });
    }, [navigate]);

    return <p>Você foi deslogado. Redirecionando...</p>;
};

export default Logout;
