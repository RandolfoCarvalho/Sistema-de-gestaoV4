import { useState, useEffect } from 'react';
import axios from 'axios';

// Hook personalizado para gerenciar o estado e lógica do checkout
export const useCheckout = (cart, cartTotal, currentStore, clearCart, navigate) => {
    const [formData, setFormData] = useState({
        FinalUserName: 'Randolfo',
        FinalUserTelefone: localStorage.getItem("FinalUserTelefone"),
        FinalUserId: localStorage.getItem('userId') || null,
        RestauranteId: localStorage.getItem('restauranteId') || 1,
        observacoes: '',
        endereco: {
            Logradouro: '',
            Numero: '',
            Complemento: '',
            Bairro: '',
            Cidade: '',
            CEP: ''
        },
        pagamento: {
            SubTotal: cartTotal,
            TaxaEntrega: 0,
            Desconto: 0,
            ValorTotal: cartTotal,
            FormaPagamento: 'dinheiro'
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Estado para controlar o modal de pagamento
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('dinheiro');
    
    // Atualiza o valor total sempre que o cartTotal mudar
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            pagamento: {
                ...prev.pagamento,
                SubTotal: cartTotal,
                ValorTotal: cartTotal + (prev.pagamento?.TaxaEntrega || 0) - (prev.pagamento?.Desconto || 0)
            }
        }));
    }, [cartTotal]);

    // Preparar o pedidoDTO para enviar ao processamento de pagamento
    const preparePedidoDTO = () => {
        // Estrutura do DTO
        return {
            FinalUserName: formData.FinalUserName,
            FinalUserTelefone: formData.FinalUserTelefone,
            FinalUserId: formData.FinalUserId || null,
            NomeDaLoja: currentStore,
            RestauranteId: !isNaN(formData.RestauranteId) 
                ? formData.RestauranteId 
                : Number(localStorage.getItem('restauranteId')),
            Observacoes: formData.observacoes || '',

            // Objeto de endereço
            Endereco: {
                Logradouro: formData.endereco?.Logradouro || '',
                Numero: formData.endereco?.Numero || '',
                Complemento: formData.endereco?.Complemento || '',
                Bairro: formData.endereco?.Bairro || '',
                Cidade: formData.endereco?.Cidade || '',
                CEP: formData.endereco?.CEP || ''
            },

            // Objeto de pagamento
            Pagamento: {
                SubTotal: cartTotal,
                TaxaEntrega: formData.pagamento?.TaxaEntrega || 0,
                Desconto: formData.pagamento?.Desconto || 0,
                ValorTotal: cartTotal + (formData.pagamento?.TaxaEntrega || 0) - (formData.pagamento?.Desconto || 0)
            },

            // Itens do pedido
            Itens: cart.map(item => ({
                ProdutoId: item.id,
                NomeProduto: item.nome || item.title || '',
                Quantidade: item.quantity,
                PrecoUnitario: item.precoVenda,
                SubTotal: item.precoVenda * item.quantity,
                PrecoCusto: item.precoCusto || 0,
                Observacoes: item.observacoes || '',
                OpcoesExtras: Array.isArray(item.selectedExtras)
                    ? item.selectedExtras.map(extra => ({
                        TipoOpcao: extra.tipoOpcao || 0,
                        ReferenciaId: extra.id,
                        Nome: extra.nome,
                        Quantidade: extra.quantity,
                        PrecoUnitario: extra.preco || extra.precoAdicional || extra.precoBase || 0
                    }))
                    : []
            }))
        };
    };

    // Função para iniciar o processo de pagamento
    const handleProceedToPayment = (paymentMethod) => {
        setSelectedPaymentMethod(paymentMethod);
        setFormData(prev => ({
            ...prev,
            pagamento: {
                ...prev.pagamento,
                FormaPagamento: paymentMethod
            }
        }));
        setShowPaymentModal(true);
    };

    // Função quando o pagamento é bem-sucedido
    const handlePaymentSuccess = () => {
        clearCart();
        navigate('/pedido-sucesso');
    };

    return {
        formData,
        setFormData,
        isSubmitting,
        showPaymentModal,
        setShowPaymentModal,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        handleProceedToPayment,
        handlePaymentSuccess,
        preparePedidoDTO
    };
};

export default useCheckout;