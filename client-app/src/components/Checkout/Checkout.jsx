import React, { useState, useEffect } from "react";
import { useCart } from "../Carrinho/CartContext";
import { useNavigate } from "react-router-dom";
import { useStore } from "../Context/StoreContext";
import FinalUserModal from "../Modals/FinalUserModal";
import PaymentModal from "../Pagamento/PaymentModal";
import CheckoutSteps from "./CheckoutSteps";
import CheckoutForm from "./CheckoutForm";
import OrderSummary from "./OrderSummary";
import { useCheckout } from "./hooks/useCheckout";
import HeaderPublic from '../HeaderPublic/HeaderPublic';
import PaymentMethods from "./PaymentMethods";
// Certifique-se que este componente existe e está sendo utilizado para selecionar a forma de pagamento
import axios from "axios";
import Swal from "sweetalert2";



const Checkout = () => {
    const { cart, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
    const navigate = useNavigate();
    const { currentStore } = useStore();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [showFinalUserModal, setShowFinalUserModal] = useState(false);
    const {
        formData,
        setFormData,
        isSubmitting,
        preparePedidoDTO
    } = useCheckout(cart, cartTotal, currentStore, clearCart, navigate);

    useEffect(() => {
        // Moved verification functions into useEffect to avoid running on every render
        async function verifyStore() {
            try {
                const restauranteIdResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/restaurante/BuscarRestauranteIdPorNome/${currentStore}`);
                const restauranteId = restauranteIdResponse.data;

                //seta restauranteId no localStorage
                localStorage.setItem('restauranteId', restauranteId);
                
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/restaurante/isLojaOpen/${restauranteId}`);
                
                if (cartTotal <= 0) {
                    Swal.fire({
                        title: "Carrinho vazio",
                        text: "Adicione produtos ao seu carrinho primeiro!",
                        icon: "warning",
                        confirmButtonText: "Entendi",
                        confirmButtonColor: "#ff5733"
                    });
                    navigate(`/loja/${currentStore}`);
                }
            } catch (error) {
                console.error("Erro ao verificar loja:", error);
                Swal.fire({
                    title: "Erro",
                    text: "Erro ao verificar a disponibilidade da loja. Tente novamente mais tarde.",
                    icon: "error",
                    confirmButtonText: "Fechar",
                    confirmButtonColor: "#d33"
                });
                navigate(`/loja/${currentStore}`);
            }
        }

        async function verifyFinalUser() {
            try {
                const FinalUserTelefone = localStorage.getItem("FinalUserTelefone");
                const finalUserResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/finaluser/UserExists/${FinalUserTelefone}`);
            } catch (error) {
                console.error("Erro ao verificar o usuário:", error);
                setShowFinalUserModal(true);
            }
        }

        verifyStore();
        verifyFinalUser();
    }, [currentStore, cartTotal, navigate]);

    // Validate address fields
    const validateAddress = () => {
        const requiredFields = ['Logradouro', 'Numero', 'Bairro', 'Cidade', 'CEP'];
        const missingFields = [];
        
        requiredFields.forEach(field => {
            if (!formData.endereco?.[field]) {
                missingFields.push(field);
            }
        });
        
        // Validate CEP format
        const cepRegex = /^\d{5}-?\d{3}$/;
        if (formData.endereco?.CEP && !cepRegex.test(formData.endereco.CEP)) {
            Swal.fire({
                title: "CEP Inválido",
                text: "Por favor, digite um CEP válido no formato 12345-678",
                icon: "warning",
                confirmButtonText: "Entendi",
                confirmButtonColor: "#ff5733"
            });
            return false;
        }
        
        if (missingFields.length > 0) {
            const fieldNames = {
                Logradouro: 'Rua',
                Numero: 'Número',
                Bairro: 'Bairro',
                Cidade: 'Cidade',
                CEP: 'CEP'
            };
            
            Swal.fire({
                title: "Campos obrigatórios",
                text: `Por favor, preencha os seguintes campos: ${missingFields.map(f => fieldNames[f]).join(', ')}`,
                icon: "warning",
                confirmButtonText: "Entendi",
                confirmButtonColor: "#ff5733"
            });
            return false;
        }
        
        return true;
    };

    const handleFinalizarPedido = (e) => {
        e.preventDefault(); // Prevent default form submission
        
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        
        // Verificar se os campos obrigatórios estão preenchidos
        const validateForm = () => {
            // Validate address first
            if (!validateAddress()) {
                return false;
            }
            
            // Verificar se uma forma de pagamento foi selecionada
            if (!formData.pagamento || !formData.pagamento.FormaPagamento) {
                Swal.fire({
                    title: "Forma de pagamento",
                    text: "Por favor, selecione uma forma de pagamento",
                    icon: "warning",
                    confirmButtonText: "Entendi",
                    confirmButtonColor: "#ff5733"
                });
                return false;
            }
            
            return true;
        };
        
        if (isAuthenticated) {
            // Só mostrar o modal de pagamento se os dados foram preenchidos
            if (validateForm()) {
                setPaymentModalOpen(true);
            }
        } else {
            // Se não estiver autenticado, mostrar o modal de autenticação primeiro
            // sem validar os campos - a validação ocorrerá depois da autenticação
            setIsAuthModalOpen(true);
        }
    };

    const handleUserModalSuccess = (userData) => {
        setFormData(prev => ({
            ...prev,
            FinalUserName: userData.nome,
            FinalUserTelefone: userData.telefone,
            FinalUserId: userData.id
        }));
        setShowFinalUserModal(false);
        setIsAuthModalOpen(false);
        
        // Apenas fechar o modal de autenticação após o sucesso
        // Permitir que o usuário preencha os campos de endereço e pagamento primeiro
        // Ele precisará clicar no botão "Finalizar Pedido" novamente para prosseguir
        
        // Mostrar uma mensagem informativa para orientar o usuário
        Swal.fire({
            title: "Autenticação bem-sucedida!",
            text: "Agora preencha os dados de endereço e pagamento para continuar.",
            icon: "success",
            confirmButtonText: "Entendi",
            confirmButtonColor: "#4BB543"
        });
    };

    const handlePaymentSuccess = () => {
        clearCart();
        navigate('/pedidos');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <HeaderPublic />
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 mt-24">
                <CheckoutSteps />
                {/* Modal de autenticação */}
                {isAuthModalOpen && (
                    <FinalUserModal
                        isOpen={isAuthModalOpen}
                        onClose={() => setIsAuthModalOpen(false)}
                        onSuccess={handleUserModalSuccess}
                    />
                )}

                {/* Modal de pagamento com a função preparePedidoDTO passada como prop */}
                {isPaymentModalOpen && (
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setPaymentModalOpen(false)}
                        paymentMethod={formData.pagamento?.FormaPagamento}
                        cartTotal={cartTotal}
                        onPaymentSuccess={handlePaymentSuccess}
                        preparePedidoDTO={preparePedidoDTO}
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <CheckoutForm formData={formData} setFormData={setFormData} />
                    </div>
                    <OrderSummary
                        cart={cart}
                        cartTotal={cartTotal}
                        updateQuantity={updateQuantity}
                        removeFromCart={removeFromCart}
                    />
                </div>
                
                {/* Form isolado apenas para o botão de finalizar */}
                <form onSubmit={handleFinalizarPedido}>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-4 px-6 rounded-full font-semibold hover:bg-blue-700 transition-colors mt-6"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Processando..." : "Finalizar Pedido"}
                    </button>
                </form>

                {/* Caso a validacao dos campos do finalUser esteja faltando algo mostra o modal */}
                {showFinalUserModal && (
                    <FinalUserModal
                        isOpen={showFinalUserModal}
                        onClose={() => setShowFinalUserModal(false)}
                        onSuccess={handleUserModalSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default Checkout;