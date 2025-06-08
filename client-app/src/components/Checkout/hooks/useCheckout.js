import { useState, useEffect } from 'react';
import axios from 'axios';
import FinalUserModal from '../../Modals/FinalUserModal';
import Swal from 'sweetalert2';

// Hook personalizado para gerenciar o estado e lógica do checkout
export const useCheckout = (cart, cartTotal, currentStore, clearCart, navigate) => {
    const [userId, setUserId] = useState(localStorage.getItem('userId') || null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        FinalUserName: localStorage.getItem("FinalUserName"),
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
        const nome = localStorage.getItem("FinalUserName");
        const telefone = localStorage.getItem("FinalUserTelefone");
        if (!nome || !telefone) {
            setIsUserModalOpen(true);
        } else {
            // Se já tiver os dados, garanta que o estado do formulário está atualizado
            setFormData(prev => ({
                ...prev,
                FinalUserName: nome,
                FinalUserTelefone: telefone,
            }));
        }
     }, [cartTotal]);

     const handleUserSuccess = (userData) => {
        setFormData(prev => ({ ...prev, FinalUserName: userData.nome, FinalUserTelefone: userData.telefone, FinalUserId: userData.id }));
            setIsUserModalOpen(false); // Fecha o modal
            Swal.fire({ title: "Autenticação bem-sucedida!", text: "Agora preencha os dados de endereço e pagamento para continuar.", icon: "success", confirmButtonText: "Entendi", confirmButtonColor: "#4BB543" });
        };

    useEffect(() => {
        const verificarOuCriarUsuario = async () => {
            const telefone = formData.FinalUserTelefone;
            const nome = formData.FinalUserName;
            
            if (!telefone || !nome) return;
    
            try {
                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/1.0/FinalUserAuth/VerificarTelefone`,
                    { Telefone: telefone, Nome: nome }
                );
    
                if (response.data?.id) {
                    const id = response.data.id;
                    setUserId(id); // Atualiza o estado
                    localStorage.setItem("userId", id);
                } else {
                    console.warn("Resposta inesperada da API.");
                }
            } catch (error) {
                console.error("Erro ao verificar/criar usuário:", error);
            }
        };
    
        verificarOuCriarUsuario();
    }, [formData.FinalUserTelefone, formData.FinalUserName]);
    
    const preparePedidoDTO = () => {
        // Estrutura do DTO
        return {
            FinalUserName: formData.FinalUserName,
            FinalUserTelefone: formData.FinalUserTelefone,
            FinalUserId: userId,
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
                ValorTotal: cartTotal + (formData.pagamento?.TaxaEntrega || 0) - (formData.pagamento?.Desconto || 0),
                FormaPagamento: formData.pagamento?.FormaPagamento || 'dinheiro'
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
                        // --- AQUI ESTÁ A CORREÇÃO ---
                        // Mapeia a string 'adicional' para 1, e qualquer outra coisa (como 'complemento') para 0.
                        TipoOpcao: extra.type === 'adicional' ? 1 : 0, 

                        ReferenciaId: extra.id,
                        Nome: extra.nome,
                        Quantidade: extra.quantity,
                        PrecoUnitario: extra.price || extra.preco || extra.precoAdicional || extra.precoBase || 0
                    }))
                    : []
            }))
        };
    };
    // Função para iniciar o processo de pagamento
    const handleProceedToPayment = (paymentMethod) => {
        // Se os dados do usuário ainda não foram preenchidos, abra o modal de identificação
        if (!formData.FinalUserName || !formData.FinalUserTelefone) {
            setIsUserModalOpen(true);
            return; // Impede a continuação
        }

        // Se os dados estiverem ok, prossiga para o modal de pagamento
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
        preparePedidoDTO,
        // NOVOS RETORNOS
        isUserModalOpen,
        setIsUserModalOpen,
        handleUserSuccess
    };
};

export default useCheckout;