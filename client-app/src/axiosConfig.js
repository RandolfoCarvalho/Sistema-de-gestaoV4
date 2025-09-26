import axios from 'axios';

// ===================================================================
// 1. CONFIGURAÇÃO BASE DO AXIOS
// ===================================================================
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL, 
});

// Interceptor para adicionar o token de autenticação em cada requisição
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

//Interceptor para tratar erros de resposta globalmente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error("Não autorizado! Redirecionando para login...");
            // Ex: window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);


// ===================================================================
// 2. DEFINIÇÃO DA CAMADA DE SERVIÇO
// ===================================================================
const orderService = {
    /**
     * Obtém o ID do restaurante do usuário autenticado.
     */
    getRestaurantId: () => api.get('/api/1.0/Restaurante/ObterRestauranteIdDoUsuarioAutenticado/'),

    /**
     * Busca os detalhes completos de um pedido para o processo de cancelamento.
     */
    getOrderDetailsForCancellation: (orderId) => api.post(`/api/1.0/MercadoPago/buscarTransactionId/${orderId}`),

    /**
     * Registra o cancelamento de um pedido que não precisa de estorno.
     */
    cancelOrderWithoutRefund: (payload) => api.post('/api/1.0/Pedido/registrarCancelamento', payload),
    
    /**
     * Processa o reembolso de um pagamento online.
     */
    processRefund: (payload) => api.post('/api/1.0/MercadoPago/processaReembolso', payload),
};


// ===================================================================
// 3. ANEXAR OS SERVIÇOS À INSTÂNCIA PRINCIPAL
// ===================================================================

// pode acessar via `api.order.metodo()`.
api.order = orderService;

export default api;