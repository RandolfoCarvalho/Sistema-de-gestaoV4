import React, { useState, useEffect } from "react";
// ... (todos os seus outros imports permanecem os mesmos) ...
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
import axios from "axios";
import Swal from "sweetalert2";

const Checkout = () => {
    const { cart, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
    const navigate = useNavigate();
    const { currentStore } = useStore();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [showFinalUserModal, setShowFinalUserModal] = useState(false);
    const [blockCheckoutMessage, setBlockCheckoutMessage] = useState('');

    const {
        formData,
        setFormData,
        isSubmitting,
        preparePedidoDTO
    } = useCheckout(cart, cartTotal, currentStore, clearCart, navigate);

    useEffect(() => {
        const updateCheckoutRules = async () => {
            if (cartTotal <= 0) {
                setBlockCheckoutMessage("Carrinho vazio. Adicione produtos para continuar.");
                return;
            }
            try {
                const restauranteIdResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/restaurante/BuscarRestauranteIdPorNome/${currentStore}`);
                const restauranteId = restauranteIdResponse.data;
                localStorage.setItem('restauranteId', restauranteId);
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/restaurante/isLojaOpen/${restauranteId}`);
                if (!response.data.isOpen) {
                    setBlockCheckoutMessage("Loja fechada. Não é possível finalizar o pedido no momento.");
                    return;
                }
                setBlockCheckoutMessage('');
            } catch (error) {
                console.error("Erro ao verificar status da loja:", error);
                setBlockCheckoutMessage("Não foi possível verificar o status da loja. Tente novamente mais tarde.");
            }
        };

        async function verifyFinalUser() {
            try {
                const FinalUserTelefone = localStorage.getItem("FinalUserTelefone");
                if (!FinalUserTelefone) return;
                const finalUserResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/finaluser/UserExists/${FinalUserTelefone}`);
                if (finalUserResponse.data && finalUserResponse.data.exists === false) {
                    setShowFinalUserModal(true);
                }
            } catch (error) {
                console.error("Erro ao verificar o usuário final:", error);
                if (error.response && error.response.status === 404) {
                    setShowFinalUserModal(true);
                }
            }
        }
        updateCheckoutRules();
        verifyFinalUser();
    }, [currentStore, cartTotal]);

    const validateAddress = () => {
        // ... (sua função validateAddress existente, sem alterações)
        const requiredFields = ['Logradouro', 'Numero', 'Bairro', 'Cidade', 'CEP'];
        const missingFields = [];
        requiredFields.forEach(field => {
            if (!formData.endereco?.[field]) {
                missingFields.push(field);
            }
        });
        const cepRegex = /^\d{5}-?\d{3}$/;
        if (formData.endereco?.CEP && !cepRegex.test(formData.endereco.CEP)) {
            Swal.fire({ title: "CEP Inválido", text: "Por favor, digite um CEP válido no formato 12345-678", icon: "warning", confirmButtonText: "Entendi", confirmButtonColor: "#ff5733" });
            return false;
        }
        if (missingFields.length > 0) {
            const fieldNames = { Logradouro: 'Rua', Numero: 'Número', Bairro: 'Bairro', Cidade: 'Cidade', CEP: 'CEP' };
            Swal.fire({ title: "Campos obrigatórios", text: `Por favor, preencha os seguintes campos: ${missingFields.map(f => fieldNames[f]).join(', ')}`, icon: "warning", confirmButtonText: "Entendi", confirmButtonColor: "#ff5733" });
            return false;
        }
        return true;
    };

    const handleFinalizarPedido = (e) => {
        e.preventDefault();
        if (blockCheckoutMessage) {
            console.warn("Tentativa de finalizar pedido enquanto bloqueado:", blockCheckoutMessage);
            return;
        }
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        const validateForm = () => {
            if (!validateAddress()) return false;
            if (!formData.pagamento || !formData.pagamento.FormaPagamento) {
                Swal.fire({ title: "Forma de pagamento", text: "Por favor, selecione uma forma de pagamento", icon: "warning", confirmButtonText: "Entendi", confirmButtonColor: "#ff5733" });
                return false;
            }
            return true;
        };
        if (isAuthenticated) {
            if (validateForm()) {
                setPaymentModalOpen(true);
            }
        } else {
            setIsAuthModalOpen(true);
        }
    };

    const handleUserModalSuccess = (userData) => {
        setFormData(prev => ({ ...prev, FinalUserName: userData.nome, FinalUserTelefone: userData.telefone, FinalUserId: userData.id }));
        setShowFinalUserModal(false);
        setIsAuthModalOpen(false);
        Swal.fire({ title: "Autenticação bem-sucedida!", text: "Agora preencha os dados de endereço e pagamento para continuar.", icon: "success", confirmButtonText: "Entendi", confirmButtonColor: "#4BB543" });
    };

    const handlePaymentSuccess = () => {
        clearCart();
        navigate('/pedidos');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <HeaderPublic />
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 mt-24">
                {/* A mensagem de bloqueio foi MOVIDA daqui */}
                <CheckoutSteps />

                {isAuthModalOpen && (
                    <FinalUserModal
                        isOpen={isAuthModalOpen}
                        onClose={() => setIsAuthModalOpen(false)}
                        onSuccess={handleUserModalSuccess}
                    />
                )}

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

                {/* Formulário para o botão de finalizar pedido */}
                <form onSubmit={handleFinalizarPedido} className="mt-8 text-center"> {/* Adicionado text-center ao form se a mensagem for centralizada */}
                    
                    {/* NOVA POSIÇÃO E ESTILO para a Mensagem de Bloqueio */}
                    {blockCheckoutMessage && (
                        <p className="text-sm text-red-600 dark:text-red-500 mb-4">
                            {/* Você pode adicionar um ícone de aviso aqui se desejar, ex: usando Heroicons ou SVGs */}
                            {/* Ex: <svg className="inline h-4 w-4 mr-1 align-text-bottom" ... > ... </svg> */}
                            {blockCheckoutMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className={`w-full text-white py-4 px-6 rounded-full font-semibold transition-colors ${
                            isSubmitting || blockCheckoutMessage
                            ? 'bg-gray-400 cursor-not-allowed opacity-70'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        disabled={isSubmitting || !!blockCheckoutMessage}
                    >
                        {isSubmitting ? "Processando..." : "Finalizar Pedido"}
                    </button>
                </form>

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