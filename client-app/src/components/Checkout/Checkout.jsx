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
import axios from "axios";
import Swal from "sweetalert2";

const Checkout = () => {
    const { cart, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
    const navigate = useNavigate();
    const { currentStore } = useStore();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('dinheiro');
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const {
        formData,
        setFormData,
        isSubmitting,
        preparePedidoDTO
    } = useCheckout(cart, cartTotal, currentStore, clearCart, navigate);

    async function VerificarLoja() {
        const navigate = useNavigate();

        try {
            const restauranteIdResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/restaurante/BuscarRestauranteIdPorNome/${currentStore}`);
            const restauranteId = restauranteIdResponse.data;

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/restaurante/isLojaOpen/${restauranteId}`);
            if (!response.data.isOpen) {
                Swal.fire({
                    title: "Loja Fechada",
                    text: "A loja está fechada no momento. Por favor, volte mais tarde!",
                    icon: "warning",
                    confirmButtonText: "Entendi",
                    confirmButtonColor: "#ff5733"
                });
                navigate(`/loja/${currentStore}`);
            } else if (cartTotal <= 0) {
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
    //Verifica disponibilidade loja e carrinho
    VerificarLoja();
    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        if (isAuthenticated) {
            setPaymentModalOpen(true);
        } else {
            setIsAuthModalOpen(true);
        }
    };

    const handlePaymentSuccess = () => {
        clearCart();
        navigate('/pedidos');
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-24 py-12">
            <HeaderPublic />
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16">
                <CheckoutSteps />
                {/* Modal de autenticação */}
                {isAuthModalOpen && (
                    <FinalUserModal
                        isOpen={isAuthModalOpen}
                        onClose={() => setIsAuthModalOpen(false)}
                        onSuccess={(userData) => {
                            setFormData(prev => ({
                                ...prev,
                                FinalUserName: userData.Nome,
                                FinalUserTelefone: userData.Telefone,
                                FinalUserId: userData.Id
                            }));
                            setIsAuthModalOpen(false);
                            setPaymentModalOpen(true);
                        }}
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

                <form onSubmit={handleSubmit}>
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
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Processando..." : "Finalizar Pedido"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Checkout;