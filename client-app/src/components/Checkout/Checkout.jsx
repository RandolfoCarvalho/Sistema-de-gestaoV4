import React, { useState, useEffect } from "react";
import { useCart } from "../Context/CartContext";
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
    const { taxaEntrega } = useStore(); 
    const {
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
        userId,
    } = useCheckout(cart, cartTotal, taxaEntrega, currentStore, clearCart, navigate);

    const [blockCheckoutMessage, setBlockCheckoutMessage] = useState('');

    useEffect(() => {
        const checkStoreStatusAndPreRequisites = async () => {
            if (cart.length === 0) {
                setBlockCheckoutMessage("Seu carrinho está vazio. Adicione produtos para continuar.");
                return;
            }
            try {
                const restauranteIdResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/restaurante/BuscarRestauranteIdPorNome/${currentStore}`);
                const restauranteId = restauranteIdResponse.data;
                localStorage.setItem('restauranteId', restauranteId);

                const lojaAberta = await IsLojaOpen(restauranteId);
                if (!lojaAberta) {
                    setBlockCheckoutMessage("A loja está fechada. Não é possível finalizar o pedido no momento.");
                    return;
                }
                
                setBlockCheckoutMessage('');

            } catch (error) {
                console.error("Erro ao verificar pré-requisitos do checkout:", error);
                setBlockCheckoutMessage("Não foi possível verificar o status da loja. Tente novamente mais tarde.");
            }
        };

        checkStoreStatusAndPreRequisites();
    }, [currentStore, cart]);

    const handleFinalizarPedido = async (e) => {
        e.preventDefault();
        let isAuthenticated = false;
        if (!formData.FinalUserTelefone || !userId) {
            setIsUserModalOpen(true);
            return;
        }
        try {
            // Tenta verificar se o usuário existe no backend
            const result = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/FinaluserAuth/Exists`,
                JSON.stringify(formData.FinalUserTelefone),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (result.status === 200) {
                isAuthenticated = true;
            }
        } catch (ex) {
            if (ex.response && ex.response.status === 404) {
                console.log("Usuário não encontrado");
            } else {
                console.error("Erro ao verificar usuário:", ex);
            }
        }
        if (!isAuthenticated) {
            setIsUserModalOpen(true);
            return;
        }
        if (blockCheckoutMessage) {
            showInfo("Atenção", blockCheckoutMessage);
            return;
        }

        const { isValid, errors } = validateForm(formData, formData.TipoEntrega); 
        if (!isValid) {
            showError("Formulário incompleto", errors[0]);
            return;
        }
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = () => {
        Swal.fire({
            title: "Pedido Realizado!",
            text: "Seu pedido foi enviado com sucesso!",
            icon: "success",
            timer: 3000,
            showConfirmButton: false,
        }).then(() => {
            clearCart();
            navigate('/pedidos');
        });
    };
    
    const taxaExibida = formData.TipoEntrega === 'RETIRADA' ? 0 : taxaEntrega;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <HeaderPublic />
            <StoreInfo />
            <main className="flex-grow py-12">
                <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16">
                    <CheckoutSteps />
                    
                    <FinalUserModal 
                        isOpen={isUserModalOpen}
                        onClose={() => setIsUserModalOpen(false)}
                        onSuccess={handleUserSuccess}
                    />

                    {showPaymentModal && (
                        <PaymentModal
                            isOpen={showPaymentModal}
                            onClose={() => setShowPaymentModal(false)}
                            paymentMethod={formData.pagamento?.FormaPagamento}
                            cartTotal={formData.pagamento.ValorTotal} 
                            onPaymentSuccess={handlePaymentSuccess}
                            preparePedidoDTO={preparePedidoDTO}
                            setIsSubmitting={setIsSubmitting}
                        />
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8"> 
                        <div className="lg:col-span-2">
                            <CheckoutForm formData={formData} setFormData={setFormData} />
                        </div>
                        <OrderSummary
                            taxaEntrega={taxaExibida}
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
                            {isSubmitting ? "Processando..." : `Ir para Pagamento (R$ ${formData.pagamento.ValorTotal.toFixed(2).replace('.',',')})`}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Checkout;