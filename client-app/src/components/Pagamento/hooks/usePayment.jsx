// hooks/usePayment.js
import axios from 'axios';
import { useState } from 'react';

const usePayment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Modificado para receber também o pedidoDTO
    const processPayment = async (paymentData, pedidoDTO) => {
        setLoading(true);
        setError(null);
        try {
            // Agora enviamos tanto os dados de pagamento quanto os dados do pedido
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/processaPagamento`,
                {
                    DadosPagamento: paymentData,
                    PedidoDTO: pedidoDTO
                }
            );
            setLoading(false);
            return { ok: true, data: response.data };
        } catch (err) {
            setError(err.response?.data || err.message);
            setLoading(false);
            return { ok: false, error: err.response?.data || err.message };
        }
    };
    // Modificado para receber também o pedidoDTO
    const processPaymentDinheiro = async (paymentData, pedidoDTO) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/processaPagamentoDinheiro`,
                {
                    DadosPagamento: paymentData,
                    PedidoDTO: pedidoDTO
                }
            );
            setLoading(false);
            return { ok: true, data: response.data };
        } catch (err) {
            setError(err.response?.data || err.message);
            setLoading(false);
            return { ok: false, error: err.response?.data || err.message };
        }
    };
     // Processamento do pagamento PIX (sem alterações)
    const processPaymentPix = async (paymentData, pedidoDTO) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/processaPagamentoPix`,
                {
                    DadosPagamento: paymentData,
                    PedidoDTO: pedidoDTO
                }
            );
            
            setLoading(false);
            return { ok: true, data: response.data };
        } catch (err) {
            setError(err.response?.data || err.message);
            setLoading(false);
            return { ok: false, error: err.response?.data || err.message };
        }
    };

    return { processPayment, processPaymentPix, processPaymentDinheiro, loading, error };
};

export default usePayment;