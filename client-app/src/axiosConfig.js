// axiosConfig.js
import axios from 'axios';

// Crie uma instância do axios
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL, // A URL base para as requisições
});

// Adicione um interceptor de requisição para adicionar o token globalmente
api.interceptors.request.use((config) => {
    // Obtém o token armazenado no localStorage
    const token = localStorage.getItem('token');

    // Se o token existir, adiciona ao cabeçalho da requisição
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
}, (error) => {
    // Lida com erros de requisição
    return Promise.reject(error);
});

// Exporte a instância configurada do axios
export default api;
