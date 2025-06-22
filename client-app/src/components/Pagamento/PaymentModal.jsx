import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import usePayment from "./hooks/usePayment";
import { useNavigate } from "react-router-dom";
import { initMercadoPago } from "@mercadopago/sdk-react";
import FuturisticLoadingSpinner from '../ui/FuturisticLoadingSpinner';
import CardPaymentForm from "./CardPaymentForm";
import PixPaymentSection from "./PixPaymentSection";
import DinheiroPaymentForm from "./DinheiroPaymentForm";
import PixForm from "./PixForm";
import axios from "axios";
import * as signalR from '@microsoft/signalr';

const PaymentModal = ({ isOpen, onClose, paymentMethod, cartTotal, onPaymentSuccess, preparePedidoDTO, setIsSubmitting }) => {
    const { processPayment, processPaymentPix, processPaymentDinheiro, loading: paymentLoading, error: paymentError } = usePayment();
    const navigate = useNavigate();
    const [troco, setTroco] = useState("");
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalError, setInternalError] = useState(null);
    const [pixData, setPixData] = useState(null);
    const [transactionId, setTransactionId] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const [countdown, setCountdown] = useState(300);
    const [paymentSuccessState, setPaymentSuccessState] = useState(false);
    const [paymentResponseData, setPaymentResponseData] = useState(null); 

    const restauranteId = localStorage.getItem("restauranteId");
    const amountForDisplay = parseFloat(cartTotal) || 0;

    useEffect(() => {
        const restauranteId = localStorage.getItem("restauranteId");
        if (!restauranteId) {
            console.error("RestauranteId não encontrado no localStorage");
            return;
        }
        fetch(`${process.env.REACT_APP_API_URL}/api/1.0/CredenciaisMercadoPago/GetCredentialByRestauranteId/${restauranteId}`)
        .then(res => {
            if (!res.ok) throw new Error("Erro ao buscar credencial");
            return res.json();
        })
        .then(data => {
            if (data.publicKey) {
            initMercadoPago(data.publicKey, { locale: 'pt-BR' });
            }
        })
        .catch(err => {
            console.error("Erro ao buscar credencial do restaurante:", err);
        });
    }, []);

    useEffect(() => {
        if (setIsSubmitting) {
            setIsSubmitting(paymentLoading || internalLoading);
        }
    }, [paymentLoading, internalLoading, setIsSubmitting]);

    useEffect(() => {
        if (paymentSuccessState) {
            const timer = setTimeout(() => {
                if (onPaymentSuccess) {
                    onPaymentSuccess(paymentResponseData);
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [paymentSuccessState, paymentResponseData, onPaymentSuccess]);

    useEffect(() => {
        if (!transactionId || paymentSuccessState) return;

        setMensagem("⏳ Aguardando confirmação do pagamento PIX...");
        console.log("Conectando ao SignalR em:", `${process.env.REACT_APP_API_URL}/pagamentoPixHub`);
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${process.env.REACT_APP_API_URL}/pagamentoPixHub`)
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();
        
        const startConnection = async () => {
            try {
                await connection.start();
                console.log("Conectado ao SignalR.");
                await connection.invoke("JoinPaymentGroup", transactionId);

                connection.on("PagamentoAprovado", (response) => {
                    console.log("Pagamento Aprovado recebido via SignalR:", response);
                    setMensagem("✅ Pagamento aprovado com sucesso!");
                    setPaymentResponseData(response); 
                    setPaymentSuccessState(true);
                    connection.stop();
                });

            } catch (err) {
                console.error("Falha na conexão com SignalR: ", err);
                setMensagem("⚠️ Erro de comunicação. Verifique o status na tela de pedidos.");
            }
        };

        startConnection();

        return () => {
            if (connection.state === 'Connected') {
                connection.stop();
            }
        };
    }, [transactionId, paymentSuccessState]);

    const handleSubmit = async (paymentProcessor, paymentData) => {
        setInternalLoading(true);
        setInternalError(null);
        setMensagem("Validando pedido e processando pagamento...");

        const pedidoDTO = preparePedidoDTO(paymentMethod);

        if (!pedidoDTO) {
            setInternalError("❌ Não foi possível preparar os dados do pedido.");
            setInternalLoading(false);
            return;
        }

       try {
            const response = await paymentProcessor(paymentData, pedidoDTO);

            const isPaymentApproved = response.ok && response.data?.status === "approved";
            const isDinheiroSuccess = response.ok && paymentMethod === "dinheiro";
            const isPixSuccess = response.ok && response.data?.qrCodeBase64;

            if (isPaymentApproved || isDinheiroSuccess || isPixSuccess) {
                if (paymentMethod === "pix" && isPixSuccess) {
                    setPixData({
                        qrCodeBase64: response.data.qrCodeBase64,
                        qrCodeCopyPaste: response.data.qrCodeString || response.data.qr_code,
                    });
                    setTransactionId(response.data.transactionId.toString());
                } else {
                    setMensagem(`✅ Pagamento com ${paymentMethod} processado com sucesso!`);
                    setPaymentResponseData(response);
                    setPaymentSuccessState(true);
                }
            } else {
                const errorMessage = response?.error?.message || response?.data?.message || `Falha no pagamento com ${paymentMethod}.`;
                setInternalError(`❌ ${errorMessage}`);
                setMensagem(`❌ ${errorMessage}`);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Ocorreu um erro inesperado.";
            setInternalError(`❌ ${errorMessage}`);
            setMensagem(`❌ ${errorMessage}`);
        } finally {
            setInternalLoading(false);
        }
    };
    
    const handleCardPaymentSubmit = (formData, additionalData) => {
        const fullName = additionalData.cardholderName?.trim() || "";
        const nameParts = fullName.split(/\s+/);
        const lastName = nameParts.length > 1 ? nameParts.pop() : "";
        const firstName = nameParts.join(" ");

        const paymentData = {
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
            FormaPagamento: "cartao"
        };
        handleSubmit(processPayment, paymentData);
    };

    const handleDinheiroSubmit = (e) => {
        e.preventDefault();
        if (troco && parseFloat(troco) <= amountForDisplay) {
            setInternalError("❌ O valor do troco deve ser maior que o total a pagar.");
            return;
        }
        const paymentData = { FormaPagamento: "dinheiro", trocoPara: troco ? parseFloat(troco) : null };
        handleSubmit(processPaymentDinheiro, paymentData);
    };

    const handlePixSubmit = (formData) => {
        const paymentData = { ...formData, FormaPagamento: "pix" };
        handleSubmit(processPaymentPix, paymentData);
    };

    const handleCopyPixCode = () => {
        if (pixData?.qrCodeCopyPaste) {
            navigator.clipboard.writeText(pixData.qrCodeCopyPaste)
                .then(() => alert('Código PIX copiado!'))
                .catch(() => alert('Erro ao copiar o código PIX.'));
        }
    };
    
    useEffect(() => {
        if (!pixData || countdown <= 0 || paymentSuccessState) return;
        const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown, pixData, paymentSuccessState]);

    const isLoading = paymentLoading || internalLoading;
    
    const handleClose = () => {
        if (isLoading) return;
        onClose();
        setInternalError(null);
        setMensagem("");
        setPixData(null);
        setTransactionId(null);
        setCountdown(300);
        setPaymentSuccessState(false);
        setPaymentResponseData(null);
        setTroco("");
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            contentLabel="Modal de Pagamento"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full mx-auto my-8 border border-gray-300 overflow-y-auto max-h-[90vh]"
            overlayClassName="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            shouldCloseOnOverlayClick={!isLoading}
            appElement={document.getElementById('root') || undefined}
        >
            {isLoading && <FuturisticLoadingSpinner message={mensagem || "Processando..."} />}

            {paymentSuccessState ? (
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <p className="text-5xl">✅</p>
                    <h3 className="text-xl font-semibold text-gray-800">Processado com Sucesso!</h3>
                    <p className="text-gray-700">{mensagem}</p>
                    <p className="text-sm text-gray-500 mt-2">Você será redirecionado em alguns instantes...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paymentMethod === "cartao" && (
                        <CardPaymentForm 
                            amount={amountForDisplay}
                            onSubmit={handleCardPaymentSubmit}
                            onClose={handleClose}
                            isLoading={isLoading}
                            ErrorMessage={internalError}
                        />
                    )}
                    {paymentMethod === "pix" && !pixData && (
                        <PixForm 
                            amount={amountForDisplay}
                            onSubmit={handlePixSubmit}
                            errorMessage={internalError}
                            onClose={handleClose}
                            isLoading={isLoading}
                        />
                    )}
                    {pixData && (
                        <PixPaymentSection 
                            pixData={pixData}
                            onCopyPixCode={handleCopyPixCode}
                            onClose={handleClose}
                            countdown={countdown}
                            mensagemGlobal={mensagem}
                            isLoading={isLoading} 
                        />
                    )}
                    {paymentMethod === "dinheiro" && (
                        <DinheiroPaymentForm 
                            amount={amountForDisplay}
                            troco={troco}
                            setTroco={setTroco}
                            onSubmit={handleDinheiroSubmit}
                            onClose={handleClose}
                            isLoading={isLoading}
                            errorMessage={internalError}
                        />
                    )}
                </div>
            )}
        </Modal>
    );
};

export default PaymentModal;