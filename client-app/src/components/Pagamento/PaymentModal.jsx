import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import usePayment from "./hooks/usePayment";
import { redirect, useNavigate } from "react-router-dom";
import { initMercadoPago } from "@mercadopago/sdk-react";
import FuturisticLoadingSpinner from '../ui/FuturisticLoadingSpinner';
import useSignalRPedidos from './hooks/useSignalRPedidos';
import CardPaymentForm from "./CardPaymentForm";
import PixPaymentSection from "./PixPaymentSection";
import DinheiroPaymentForm from "./DinheiroPaymentForm";
import PixForm from "./PixForm";
import axios from "axios";
import MercadoPagoWalletButton from "./MercadoPagoWalletButton";

const PaymentModal = ({ isOpen, onClose, paymentMethod, cartTotal, onPaymentSuccess, preparePedidoDTO }) => {
    const { processPayment, processPaymentPix, loading: paymentLoading, error: paymentError } = usePayment();
    const [amount, setAmount] = useState(cartTotal);
    const [pixKey, setPixKey] = useState("");
    const [troco, setTroco] = useState("");
    const navigate = useNavigate();
    const [preferenceId, setPreferenceId] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalError, setInternalError] = useState(null);
    const [pixData, setPixData] = useState(null);
    const [transactionId, setTransactionId] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const restauranteId = localStorage.getItem("restauranteId");
    const [countdown, setCountdown] = useState(300); // 5 minutos = 300 segundos

    const PUBLIC_KEY = "APP_USR-9d429645-4c80-4f72-aa71-b303ee60755f";
    
    useEffect(() => {
        setAmount(cartTotal);
    }, [cartTotal]);

    useEffect(() => {
        initMercadoPago(PUBLIC_KEY, {
            locale: 'pt-BR'
        });
    }, []);

    useEffect(() => {
        if (pixData && transactionId && restauranteId) {
            let attempts = 0;
            const maxAttempts = 60; // 60 x 5s = 5 minutos
            setMensagem("⏳ Aguardando confirmação do pagamento...");
            
            console.log(`Iniciando verificação de pagamento. TransactionId: ${transactionId}, RestauranteId: ${restauranteId}`);
    
            const interval = setInterval(async () => {
                try {
                    attempts++;
                    console.log(`Tentativa ${attempts} de verificação do pagamento`);
    
                    // Simplificando para usar apenas um endpoint prioritário
                    // O ObterPagamentoAsync não só verifica o status como também processa o pagamento se aprovado
                    const response = await axios.get(
                        `${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/ObterPagamentoAsync/${transactionId}/${restauranteId}`
                    );
                    
                    console.log(`Resposta do servidor:`, response.data);
                    
                    // Verificação unificada de status aprovado
                    const isApproved = 
                        response.data?.status === "approved" || 
                        (response.data?.message && response.data.message.includes("Pedido já"));
                    
                    if (isApproved) {
                        console.log("✅ Pagamento aprovado detectado!");
                        clearInterval(interval);
                        setMensagem("✅ Pagamento aprovado com sucesso!");
                        setTimeout(() => navigate("/pedidos"), 3000);
                    } else if (attempts >= maxAttempts) {
                        console.warn("⏳ Tempo de espera pelo pagamento expirou.");
                        clearInterval(interval);
                        setMensagem("⏳ Tempo de espera expirado. Verifique o status do seu pedido na tela de pedidos.");
                        setTimeout(() => navigate("/pedidos"), 5000);
                    } else if (attempts % 12 === 0) { // A cada 1 minuto (12 * 5s)
                        // Atualização de mensagem periódica para feedback ao usuário
                        setMensagem(`⏳ Aguardando confirmação do pagamento... (${Math.round(attempts/12)} min)`);
                    }
                } catch (err) {
                    console.error("Erro ao verificar status do pagamento:", err);
                    // Não interromper a verificação por erro pontual
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        setMensagem("⚠️ Não foi possível confirmar o pagamento. Verifique na tela de pedidos.");
                        setTimeout(() => navigate("/pedidos"), 5000);
                    }
                }
            }, 5000); // Verificar a cada 5 segundos
    
            return () => clearInterval(interval);
        }
    }, [pixData, transactionId, restauranteId, navigate]);
    useEffect(() => {
        setPreferenceId(null);
        setInternalError(null);

        if (isOpen && paymentMethod === "mercadopago") {
            const generatePreference = async () => {
                setInternalLoading(true);
                setInternalError(null);
                const pedidoDTO = preparePedidoDTO();

                if (!pedidoDTO) {
                    console.error("Falha ao preparar PedidoDTO para gerar preferência.");
                    setInternalError("Não foi possível preparar os dados do pedido.");
                    setInternalLoading(false);
                    return;
                }

                try {
                    const response = await processPayment({ FormaPagamento: "mercadopago", Amount: amount }, pedidoDTO);

                    if (response?.preferenceId) {
                        console.log("Preferência gerada:", response.preferenceId);
                        setPreferenceId(response.preferenceId);
                    } else {
                        console.error("Erro: Resposta da geração de preferência inválida:", response);
                        setInternalError(response?.error || "Erro ao gerar a preferência de pagamento. Verifique o backend.");
                    }
                } catch (error) {
                    console.error("Catch: Erro ao gerar preferência:", error);
                    setInternalError(error.message || "Ocorreu um erro inesperado ao gerar a preferência.");
                } finally {
                    setInternalLoading(false);
                }
            };
            generatePreference();
        }
    }, [isOpen, paymentMethod, amount, processPayment, preparePedidoDTO]);

    const handleCardPaymentSubmit = async (formData, additionalData) => {
        setInternalLoading(true);
        setInternalError(null);
    
        const fullName = additionalData.cardholderName?.trim() || "";
        const nameParts = fullName.split(/\s+/);
    
        let firstName = "";
        let lastName = "";
    
        if (nameParts.length === 1) {
            firstName = nameParts[0];
        } else {
            lastName = nameParts.pop(); 
            firstName = nameParts.join(" "); 
        }
    
        const pedidoDTO = preparePedidoDTO();
        if (!pedidoDTO) {
            console.error("Falha ao preparar PedidoDTO para pagamento com cartão.");
            setInternalError("❌ Não foi possível preparar os dados do pedido.");
            setInternalLoading(false);
            return;
        }
    
        const paymentData = {
            FormaPagamento: "cartao",
            Amount: parseFloat(formData.transaction_amount),
            Token: formData.token,
            PaymentMethodId: formData.payment_method_id,
            Installments: formData.installments,
            IssuerId: formData.issuer_id,
            PayerFirstName: firstName,
            PayerLastName: lastName,
            PayerEmail: formData.payer.email,
            PayerIdentificationType: formData.payer.identification.type,
            PayerIdentificationNumber: formData.payer.identification.number,
            StatusCode: 0,
            Message: ""
        };
    
        try {
            const response = await processPayment(paymentData, pedidoDTO);
    
            if (response?.ok || response?.status === 'approved') {
                setMensagem("✅ Pagamento aprovado com sucesso!");
                if (onPaymentSuccess) onPaymentSuccess();
                navigate("/pedidos");
                onClose();
            } else {
                setMensagem("❌ Pagamento não aprovado. Por favor, tente novamente.");
                console.error("Erro no pagamento com cartão (resposta backend):", response);
                setInternalError(response?.error || response?.message || "Pagamento com cartão falhou.");
            }
        } catch (error) {
            setMensagem("❌ Erro inesperado no pagamento com cartão.");
            console.error("Catch: Erro ao processar pagamento com cartão:", error);
            setInternalError(error.message || "Ocorreu um erro inesperado no pagamento com cartão.");
        } finally {
            setInternalLoading(false);
        }
    };
    
    const handleDinheiroSubmit = async (e) => {
        e.preventDefault();
        setInternalLoading(true);
        setInternalError(null);
        
        // Validação simples - troco não pode ser menor que o valor a pagar
        if (troco && parseFloat(troco) < parseFloat(amount)) {
            setInternalError("O valor do troco não pode ser menor que o total a pagar.");
            setInternalLoading(false);
            return;
        }
        
        const paymentData = {
            FormaPagamento: "dinheiro",
            Amount: parseFloat(amount),
            trocoPara: troco ? parseFloat(troco) : null,
        };
    
        const pedidoDTO = preparePedidoDTO();
        if (!pedidoDTO) {
            console.error("Falha ao preparar PedidoDTO para pagamento: dinheiro");
            setInternalError("Não foi possível preparar os dados do pedido.");
            setInternalLoading(false);
            return;
        }
    
        console.log(`Enviando para processPayment (dinheiro):`, paymentData, "com DTO:", pedidoDTO);
    
        try {
            const response = await processPaymentPix(paymentData, pedidoDTO);
    
            if (response?.ok) {
                console.log(`Pagamento com dinheiro iniciado com sucesso:`, response);
                if (onPaymentSuccess) onPaymentSuccess();
                onClose(); 
            } else {
                console.error(`Erro no pagamento com dinheiro (resposta backend):`, response);
                setInternalError(response?.error || response?.message || `Pagamento com dinheiro falhou.`);
            }
        } catch (error) {
            console.error(`Catch: Erro ao processar pagamento com dinheiro:`, error);
            setInternalError(error.message || `Ocorreu um erro inesperado no pagamento com dinheiro.`);
        } finally {
            setInternalLoading(false);
        }
    };

    const handleCopyPixCode = () => {
        if(pixData?.qrCodeCopyPaste) {
            navigator.clipboard.writeText(pixData.qrCodeCopyPaste)
                .then(() => {
                    alert('Código PIX copiado para a área de transferência!');
                })
                .catch(err => {
                    console.error('Erro ao copiar código PIX:', err);
                    alert('Erro ao copiar o código PIX.');
                });
        }
        
    };


    const verificarPagamento = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/ObterPagamentoAsync/${transactionId}/${restauranteId}`
            );

            const isApproved =
                response.data?.status === "approved" ||
                (response.data?.message && response.data.message.includes("Pedido já"));

            if (isApproved) {
                setMensagem("✅ Pagamento aprovado com sucesso!");
                setTimeout(() => navigate("/pedidos"), 3000);
            } else {
                setMensagem("⏳ Pagamento ainda não confirmado.");
            }
        } catch (error) {
            console.error("Erro ao verificar status do pagamento manual:", error);
            setMensagem("⚠️ Erro ao verificar pagamento. Tente novamente.");
        }
    };



    // Inicia o contador de 5 minutos
    useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
    }, [countdown]);

    //Pagamento PIX
    const handlePixSubmit = async (formData) => {
        setInternalLoading(true);
        setInternalError(null);
        setPixData(null);
        const paymentData = {
            FormaPagamento: "pix",
            Amount: parseFloat(formData.amount),
            PayerFirstName: formData.payerFirstName,
            PayerLastName: formData.payerLastName,
            PayerEmail: formData.payerEmail
        };
        const pedidoDTO = preparePedidoDTO();
        console.log("PedidoDTO: ", pedidoDTO); 
        if (!pedidoDTO) {
            console.error("Falha ao preparar PedidoDTO para pagamento: pix");
            setInternalError("Não foi possível preparar os dados do pedido.");
            setInternalLoading(false);
            return;
        }
        console.log(`Enviando para processPaymentPix: `, paymentData, "com DTO: ", pedidoDTO);
        try {
            const response = await processPaymentPix(paymentData, pedidoDTO);
            console.log("Resposta do backend para pagamento com pix: ", response.data);
            if (response?.ok) {
                console.log(`Resposta do backend para pix:`, response);

                if (response.data && response.data.qrCodeBase64) {
                    setPixData({
                        qrCodeBase64: response.data.qrCodeBase64,
                        qrCodeCopyPaste: response.data.qrCodeString
                    });
                    setTransactionId(response.data.idPagamento);
                    setTransactionId(response.data.idPagamento);
                    setCountdown(300);
                    console.log("Dados do PIX: ", response.data);
                } else {
                    console.error("Resposta do backend para PIX inválida:", response);
                    setInternalError("Não foi possível obter os dados do PIX. Tente novamente.");
                }
            } else {
                console.error(`Erro no pagamento com pix (resposta backend):`, response);
                setInternalError(response?.error || response?.message || `Pagamento com pix falhou.`);
            }
        } catch (error) {
            console.error(`Catch: Erro ao processar pagamento com pix:`, error);
            setInternalError(error.message || `Ocorreu um erro inesperado no pagamento com pix.`);
        } finally {
            setInternalLoading(false);
        }
    };

    const isLoading = paymentLoading || internalLoading;
    const displayError = paymentError || internalError;

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Modal de Pagamento"
            className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto mt-10 mb-10 border border-gray-300"
            overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            shouldCloseOnOverlayClick={!isLoading}
            appElement={document.getElementById('root') || undefined}
        >
            {internalLoading && <FuturisticLoadingSpinner 
                        message="Processando pagamento..."
                        accentColor="blue"
                        secondaryColor="blue" 
                        darkMode={false}
                        showBorder={false}
                        phaseMessages={["Verificando pedido", "Recebendo pagamento", "Processando detalhes", "Finalizando..."]}
                />}

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Detalhes de Pagamento</h2>

                {paymentMethod === "cartao" && (
                    <CardPaymentForm 
                        amount={amount}
                        onSubmit={handleCardPaymentSubmit}
                        onClose={onClose}
                        isLoading={isLoading}
                    />
                )}

                {paymentMethod === "pix" && !pixData && (
                    <PixForm 
                        amount={amount}
                        onSubmit={handlePixSubmit}
                        onClose={onClose}
                        isLoading={isLoading}
                    />
                )}

                {pixData && paymentMethod === 'pix' && (
                    <PixPaymentSection 
                        pixData={pixData}
                        onCopyPixCode={handleCopyPixCode}
                        onClose={onClose}
                        countdown={countdown}
                        onVerificarPagamento={verificarPagamento}
                        mensagem={mensagem}
                    />
                )}

                {paymentMethod === "dinheiro" && (
                    <DinheiroPaymentForm 
                        amount={amount}
                        troco={troco}
                        setTroco={setTroco}
                        onSubmit={handleDinheiroSubmit}
                        onClose={onClose}
                        isLoading={isLoading}
                    />
                )}

                {paymentMethod === "mercadopago" && (
                    <MercadoPagoWalletButton 
                        preferenceId={preferenceId}
                        isLoading={isLoading}
                        onClose={onClose}
                    />
                )}

                {displayError && (
                    <p className="text-red-600 text-center mt-4 bg-red-100 p-3 rounded border border-red-300 text-sm">
                        {displayError}
                    </p>
                )}
            </div>
            <div> 
            {mensagem && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-6 py-3 rounded-lg shadow-lg transition-all">
                    {mensagem}
                </div>
            )}
            </div>
        </Modal>
       
    );
};

export default PaymentModal;