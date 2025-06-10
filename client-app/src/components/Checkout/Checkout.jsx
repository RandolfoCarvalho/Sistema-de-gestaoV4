import React, { useState, useEffect } from "react";
import { useCart } from "../Carrinho/CartContext";
import { useNavigate } from "react-router-dom";
import { useStore } from "../Context/StoreContext";
import { IsLojaOpen } from '../../services/lojaService';
import { validateForm } from "../../utils/validators";
import { showError, showInfo } from "@utils/alerts";
import FinalUserModal from "../Modals/FinalUserModal";
import StoreInfo from '../HeaderPublic/StoreInfo';
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
        handleProceedToPayment,
        setFormData,
        isSubmitting,
        preparePedidoDTO,
        isUserModalOpen, 
        setIsUserModalOpen, 
        handleUserSuccess, 
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
                const lojaAberta = await IsLojaOpen(restauranteId);
                if (!lojaAberta) {
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

    const handleFinalizarPedido = async (e) => {
        e.preventDefault();

        if (blockCheckoutMessage) {
            console.warn("Tentativa de finalizar pedido enquanto bloqueado:", blockCheckoutMessage);
            return;
        }

        const restauranteId = localStorage.getItem("restauranteId");
        if (!restauranteId) {
            showError("Erro", "Restaurante não identificado. Tente novamente mais tarde.");
            return;
        }

        try {
            const lojaAberta = await IsLojaOpen(restauranteId);

            if (!lojaAberta) {
                showInfo("Loja fechada", "Ops, a loja acabou de fechar. Volte mais tarde!");
                return;
            }

            const isAuthenticated = localStorage.getItem("isAuthenticated");

            if (isAuthenticated) {
                if (validateForm(formData)) {
                    setPaymentModalOpen(true);
                }
            } else {
                setIsAuthModalOpen(true);
            }

        } catch (error) {
            console.error("Erro ao verificar loja:", error);
            showError("Erro", "Não foi possível verificar o status da loja. Tente novamente.");
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
        // O container principal não precisa mais de padding vertical.
        <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* 1. O HeaderPublic é renderizado primeiro. Ele agora ocupa seu espaço natural. */}
        <HeaderPublic />
        <StoreInfo />
        <main className="flex-grow py-12">
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16">
            <CheckoutSteps />
            {/* Renderização condicional do Modal */}
            <FinalUserModal 
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)} // Permite fechar o modal (opcional)
                onSuccess={handleUserSuccess} // Passa a função de callback
            />
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8"> 
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

            <form onSubmit={handleFinalizarPedido} className="mt-8 text-center">
                {blockCheckoutMessage && (
                <p className="text-sm text-red-600 dark:text-red-500 mb-4">
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
        </main>
        
        {/* Se a sua página de checkout tiver um BottomNav, ele deve vir aqui no final */}
        {/* <BottomNav /> */}
        </div>
    );
};

export default Checkout;