import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

export const useCheckout = (cart, cartTotal, taxaEntrega, currentStore, clearCart, navigate) => {
    // 👇 Este 'userId' é a nossa chave. Se for null, o usuário não está autenticado.
    const [userId, setUserId] = useState(localStorage.getItem('userId') || null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        FinalUserName: localStorage.getItem("FinalUserName") || '',
        FinalUserTelefone: localStorage.getItem("FinalUserTelefone") || '',
        FinalUserId: localStorage.getItem('userId') || null, 
        RestauranteId: localStorage.getItem('restauranteId') || 1,
        observacoes: '',
        endereco: { Logradouro: '', Numero: '', Complemento: '', Bairro: '', Cidade: '', CEP: '' },
        pagamento: { SubTotal: cartTotal, TaxaEntrega: taxaEntrega, Desconto: 0, ValorTotal: cartTotal + taxaEntrega , FormaPagamento: 'dinheiro' }
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('dinheiro');

    // Sincroniza o `FinalUserId` no formulário sempre que o `userId` do estado mudar.
    useEffect(() => {
        setFormData(prev => ({...prev, FinalUserId: userId}));
    }, [userId]);

    // Lógica para carregar dados do localStorage na montagem inicial
    useEffect(() => {
        const nome = localStorage.getItem("FinalUserName");
        const telefone = localStorage.getItem("FinalUserTelefone");
        if (nome && telefone) {
            setFormData(prev => ({ ...prev, FinalUserName: nome, FinalUserTelefone: telefone }));
        }
    }, []);

    useEffect(() => {
        const newTotal = cartTotal + (formData.pagamento.TaxaEntrega || 0) - (formData.pagamento.Desconto || 0);
        setFormData(prev => ({ ...prev, pagamento: { ...prev.pagamento, SubTotal: cartTotal, ValorTotal: newTotal } }));
    }, [cartTotal, formData.pagamento.TaxaEntrega, formData.pagamento.Desconto]);

    // Função para tratar o sucesso da autenticação/registro
    const handleUserSuccess = async (userData) => {
        setIsUserModalOpen(false); // Fecha o modal imediatamente
        // Define um estado de carregamento para o Swal
        Swal.fire({
            title: 'Verificando dados...',
            text: 'Por favor, aguarde.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/FinalUserAuth/login`,
                { Telefone: userData.telefone },
                {
                    validateStatus: () => true,
                }
            );
            if (response.status === 200) {
                const { id, nome, telefone } = response.data;
                setUserId(id);
                localStorage.setItem("userId", id);
                localStorage.setItem("FinalUserName", nome);
                localStorage.setItem("FinalUserTelefone", telefone);
                setFormData(prev => ({
                    ...prev,
                    FinalUserName: nome,
                    FinalUserTelefone: telefone,
                    FinalUserId: id
                }));
                Swal.fire({
                    title: "Bem-vindo(a) de volta!",
                    text: "Seus dados foram carregados. Continue com seu pedido.",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            else if (response.status === 404) {
                // Usuário não encontrado, faz o registro
                const registerResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/FinalUserAuth/register`, {
                    Nome: userData.nome,
                    Telefone: userData.telefone
                });
                const { id, nome, telefone } = registerResponse.data;
                setUserId(id);
                localStorage.setItem("userId", id);
                localStorage.setItem("FinalUserName", nome);
                localStorage.setItem("FinalUserTelefone", telefone);
                setFormData(prev => ({
                    ...prev,
                    FinalUserName: nome,
                    FinalUserTelefone: telefone,
                    FinalUserId: id
                }));

                Swal.fire({
                    title: "Cadastro realizado!",
                    text: "Seja bem-vindo(a)! Continue com seu pedido.",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            else {
                Swal.fire({
                    title: "Erro",
                    text: "Não foi possível verificar seus dados. Tente novamente mais tarde.",
                    icon: "error"
                });
            }
        } catch (error) {
            Swal.fire({
                title: "Erro inesperado",
                text: "Algo deu errado na verificação de login.",
                icon: "error"
            });
            console.error("Erro inesperado:", error);
        }
    };

    const preparePedidoDTO = (currentPaymentMethod) => {
        const valorTotalCalculadoFrontend = cartTotal + (formData.pagamento?.TaxaEntrega || 0) - (formData.pagamento?.Desconto || 0);
        return {
            FinalUserName: formData.FinalUserName,
            FinalUserTelefone: formData.FinalUserTelefone,
            FinalUserId: userId,
            NomeDaLoja: currentStore,
            RestauranteId: Number(localStorage.getItem('restauranteId')),
            Observacoes: formData.observacoes || '',
            Endereco: { Logradouro: formData.endereco?.Logradouro || '', Numero: formData.endereco?.Numero || '', Complemento: formData.endereco?.Complemento || '', Bairro: formData.endereco?.Bairro || '', Cidade: formData.endereco?.Cidade || '', CEP: formData.endereco?.CEP || '' },
            Pagamento: { SubTotal: cartTotal, TaxaEntrega: formData.pagamento?.TaxaEntrega || 0, Desconto: formData.pagamento?.Desconto || 0, ValorTotal: valorTotalCalculadoFrontend, FormaPagamento: currentPaymentMethod },
            Itens: cart.map(item => ({ ProdutoId: item.id, NomeProduto: item.nome || item.title || '', Quantidade: item.quantity, PrecoUnitario: 0, SubTotal: 0, PrecoCusto: 0, Observacoes: item.observacoes || '', OpcoesExtras: Array.isArray(item.selectedExtras) ? item.selectedExtras.map(extra => ({ TipoOpcao: extra.type === 'adicional' ? 1 : 0, ReferenciaId: extra.id, Nome: extra.nome, Quantidade: extra.quantity * item.quantity, PrecoUnitario: 0 })) : [] }))
        };
    };

    const handlePaymentSuccess = () => {
        clearCart();
        navigate('/pedido-sucesso');
    };

    return {
        formData,
        setFormData,
        isSubmitting,
        setIsSubmitting,
        showPaymentModal,
        setShowPaymentModal,
        preparePedidoDTO,
        isUserModalOpen,
        setIsUserModalOpen,
        handleUserSuccess,
        handlePaymentSuccess,
        userId, 
    };
};