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
import MercadoPagoWalletButton from "./MercadoPagoWalletButton";

const PaymentModal = ({ isOpen, onClose, paymentMethod, cartTotal, onPaymentSuccess, preparePedidoDTO }) => {
    const { processPayment, processPaymentPix, processPaymentDinheiro, loading: paymentLoading, error: paymentError } = usePayment();
    const [amount, setAmount] = useState(parseFloat(cartTotal) || 0);
    const [troco, setTroco] = useState("");
    const navigate = useNavigate();
    const [preferenceId, setPreferenceId] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalError, setInternalError] = useState(null);
    const [pixData, setPixData] = useState(null);
    const [transactionId, setTransactionId] = useState(null);
    const [mensagem, setMensagem] = useState("");
    const restauranteId = localStorage.getItem("restauranteId");
     // NOVOS ESTADOS PARA CONTROLAR A TELA DE SUCESSO
    const [paymentSuccessState, setPaymentSuccessState] = useState(false);
    const [paymentResponseData, setPaymentResponseData] = useState(null); // Para guardar a resposta do pagamento

    // Estado do PIX do segundo arquivo
    const [countdown, setCountdown] = useState(300); // 5 minutos = 300 segundos para o PIX
    useEffect(() => {
        const safeTotal = parseFloat(cartTotal) || 0;
        setAmount(safeTotal);
    }, [cartTotal]);

    // NOVO useEffect PARA GERENCIAR O REDIRECIONAMENTO APÓS O SUCESSO
    useEffect(() => {
        // Se o estado de sucesso for ativado...
        if (paymentSuccessState) {
            // ...inicia um timer de 3 segundos.
            const timer = setTimeout(() => {
                // Após o tempo, chama a função de sucesso no componente pai (se existir)
                if (onPaymentSuccess && paymentResponseData) {
                    onPaymentSuccess(paymentResponseData);
                }
                // E então navega para a página de pedidos.
                navigate("/pedidos");
            }, 3000);

            // Função de limpeza para o caso do componente ser desmontado antes do tempo
            return () => clearTimeout(timer);
        }
    }, [paymentSuccessState, paymentResponseData, onPaymentSuccess, navigate]);

    // Inicialização do MercadoPago SDK
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
            console.log("MercadoPago SDK carregado com chave do restaurante", data.publicKey);
            }
        })
        .catch(err => {
            console.error("Erro ao buscar credencial do restaurante:", err);
        });
    }, []);
    // useEffect para verificação de status de pagamento PIX (do SEGUNDO arquivo, melhorado)
    useEffect(() => {
        if (pixData && transactionId && restauranteId) {
            let attempts = 0;
            const maxAttempts = 60; // 60 x 5s = 5 minutos
            setMensagem("⏳ Aguardando confirmação do pagamento PIX...");
            // setInternalLoading(true); // O loading é ativado pelo handlePixSubmit e aqui apenas para verificação

            console.log(`Iniciando verificação de pagamento PIX. TransactionId: ${transactionId}, RestauranteId: ${restauranteId}`);
    
            const interval = setInterval(async () => {
                try {
                    attempts++;
                    console.log(`Tentativa ${attempts}/${maxAttempts} de verificação do pagamento PIX`);
    
                    const response = await axios.get(
                        `${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/ObterPagamentoAsync/${transactionId}/${restauranteId}`
                    );
                    
                    console.log(`Resposta do servidor (verificação PIX):`, response.data);
                    
                    const isApproved = 
                        response.data?.status === "approved" || 
                        (response.data?.message && response.data.message.toLowerCase().includes("pedido ja existe")) ||
                        (response.data?.message && response.data.message.toLowerCase().includes("pedido já existe"));
                    
                    if (isApproved) {
                        console.log("✅ Pagamento PIX aprovado detectado!");
                        clearInterval(interval);
                        
                        setMensagem("✅ Pagamento aprovado com sucesso!");
                        setPaymentResponseData(response.data); // Guarda a resposta
                        setPaymentSuccessState(true);          // ATIVA A TELA DE SUCESSO
                    } else if (attempts >= maxAttempts) {
                        console.warn("⏳ Tempo de espera pelo pagamento PIX expirou.");
                        clearInterval(interval);
                        setMensagem("⏳ Tempo de espera expirado. Verifique o status do seu pedido na tela de pedidos ou tente novamente.");
                    } else if (attempts % 12 === 0) { 
                        setMensagem(`⏳ Aguardando confirmação... (${Math.round(attempts/12)} min)`);
                    }
                } catch (err) {
                    console.error("Erro ao verificar status do pagamento PIX:", err);
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        // setInternalLoading(false);
                        setMensagem("⚠️ Não foi possível confirmar o pagamento PIX no momento. Verifique na tela de pedidos ou tente novamente.");
                    }
                }
            }, 5000); 
    
            return () => {
                clearInterval(interval);
                // setInternalLoading(false); 
            };
        }
    }, [pixData, transactionId, restauranteId, navigate, onClose, onPaymentSuccess]);

    // useEffect para geração de preferência "mercadopago" (como no PRIMEIRO arquivo)
    useEffect(() => {
        setPreferenceId(null);
        setInternalError(null); // Limpar erros internos ao mudar método ou abrir

        if (isOpen && paymentMethod === "mercadopago") {
            const generatePreference = async () => {
                setInternalLoading(true);
                // setInternalError(null); // Já limpou acima
                const pedidoDTO = preparePedidoDTO();

                if (!pedidoDTO) {
                    console.error("Falha ao preparar PedidoDTO para gerar preferência do Mercado Pago.");
                    setInternalError("Não foi possível preparar os dados do pedido para o Mercado Pago.");
                    setInternalLoading(false);
                    return;
                }
                if (parseFloat(amount) < 0.50) {
                     console.error("Valor do pedido (" + amount + ") é muito baixo para gerar preferência do Mercado Pago.");
                     setInternalError("O valor do pedido é muito baixo para pagamento com Mercado Pago.");
                     setInternalLoading(false);
                     return;
                }

                try {
                    const response = await processPayment({ FormaPagamento: "mercadopago", Amount: parseFloat(amount) }, pedidoDTO);

                    if (response?.preferenceId) {
                        console.log("Preferência Mercado Pago gerada:", response.preferenceId);
                        setPreferenceId(response.preferenceId);
                    } else {
                        console.error("Erro: Resposta da geração de preferência Mercado Pago inválida:", response);
                        setInternalError(response?.error || response?.message || "Erro ao gerar a preferência de pagamento com Mercado Pago.");
                    }
                } catch (error) {
                    console.error("Catch: Erro ao gerar preferência Mercado Pago:", error);
                    setInternalError(error.message || "Ocorreu um erro inesperado ao gerar a preferência do Mercado Pago.");
                } finally {
                    setInternalLoading(false);
                }
            };
            generatePreference();
        }
    }, [isOpen, paymentMethod, amount, processPayment, preparePedidoDTO]);

    // handleCardPaymentSubmit (do PRIMEIRO arquivo)
    const handleCardPaymentSubmit = async (formData, additionalData) => {
        setInternalLoading(true);
        setInternalError(null);
        setMensagem("");
    
        const fullName = additionalData.cardholderName?.trim() || "";
        const nameParts = fullName.split(/\s+/);
        let firstName = "";
        let lastName = "";
    
        if (nameParts.length === 1) {
            firstName = nameParts[0];
        } else if (nameParts.length > 1) {
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

        if (parseFloat(formData.transaction_amount) < 0.50) {
            console.error("Valor da transação (" + formData.transaction_amount + ") é muito baixo para pagamento com cartão.");
            setInternalError("O valor da transação é muito baixo para pagamento com cartão.");
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
        };
        try {
            const response = await processPayment(paymentData, pedidoDTO);
            const status = response?.data?.status;

            if (response?.ok && status === "approved") {
                setMensagem("✅ Pagamento com cartão aprovado com sucesso!");
                setPaymentResponseData(response);
                setPaymentSuccessState(true);
            } else {
                const errorMessage = response?.error?.message || "Pagamento com cartão falhou.";
                setInternalError(`❌ ${errorMessage}`);
                setMensagem(`❌ ${errorMessage}`);
            }
        } catch (error) {
            console.error("Catch: Erro ao processar pagamento com cartão:", error);
            const errorMessage = error.response?.data?.message || error.message || "Ocorreu um erro inesperado no pagamento com cartão.";
            setInternalError(`❌ ${errorMessage}`);
            setMensagem(`❌ ${errorMessage}`);
        } finally {
            setInternalLoading(false);
        }
    };
    
    const handleDinheiroSubmit = async (e) => {
        e.preventDefault();
        setInternalLoading(true);
        setInternalError(null);
        setMensagem("");
        
        if (troco && parseFloat(troco) <= parseFloat(amount)) {
            const msg = "❌ O valor do troco não pode ser menor ou igual ao total a pagar.";
            setInternalError(msg);
            setMensagem(msg);
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
            console.error("Falha ao preparar PedidoDTO para pagamento em dinheiro.");
            setInternalError("Não foi possível preparar os dados do pedido.");
            setInternalLoading(false);
            return;
        }
    
        try {
            const response = await processPaymentDinheiro(paymentData, pedidoDTO); 
    
            if (response?.ok || response?.id) { 
                console.log("response: ", response);
                setMensagem("✅ Pedido com pagamento em dinheiro registrado!");
                setPaymentResponseData(response);
                setPaymentSuccessState(true);   
            } else {
                const errorMessage = response?.error?.message || response?.error || "Registro de pagamento em dinheiro falhou.";
                console.error(`Erro no pagamento em dinheiro (resposta backend):`, errorMessage);
                setInternalError(`❌ ${errorMessage}`);
                setMensagem(`❌ ${errorMessage}`);
            }
        } catch (error) {
            console.error(`Catch: Erro ao processar pagamento em dinheiro:`, error);
            const errorMessage = error.response?.data?.message || error.message || `Ocorreu um erro inesperado.`;
            setInternalError(`❌ ${errorMessage}`);
            setMensagem(`❌ ${errorMessage}`);
        } finally {
            setInternalLoading(false);
        }
    };

    // handleCopyPixCode (do PRIMEIRO arquivo, igual ao segundo)
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

    const handlePixSubmit = async (formData) => {
        setInternalLoading(true);
        setInternalError(null);
        setPixData(null); 
        setMensagem("");   

        const pedidoDTO = preparePedidoDTO();

        if (!pedidoDTO) {
            console.error("Falha ao preparar PedidoDTO para pagamento PIX.");
            setInternalError("Não foi possível preparar os dados do pedido para PIX.");
            setMensagem("❌ Não foi possível preparar os dados do pedido para PIX.");
            setInternalLoading(false);
            return;
        }

        try {
            // 🔎 Verifica se o estoque está disponível antes de gerar o QR Code
            const estoqueValidoResponse = await verificarEstoquePedido(pedidoDTO);
            console.log("estoqueValidoResponse", estoqueValidoResponse)
            if (estoqueValidoResponse?.statusText != "OK") {
                setInternalError("❌ Estoque insuficiente ou pedido inválido.");
                setMensagem("❌ Estoque insuficiente ou pedido inválido.");
                setInternalLoading(false);
                return;
            }
            const paymentData = {
                FormaPagamento: "pix",
                Amount: parseFloat(formData.amount),
                PayerFirstName: formData.payerFirstName,
                PayerLastName: formData.payerLastName,
                PayerEmail: formData.payerEmail
            };
            const response = await processPaymentPix(paymentData, pedidoDTO);
            if (response?.ok && response.data?.qrCodeBase64 && response.data?.idPagamento) {
                setPixData({
                    qrCodeBase64: response.data.qrCodeBase64,
                    qrCodeCopyPaste: response.data.qrCodeString || response.data.qr_code,
                });
                setTransactionId(response.data.idPagamento.toString());
                setCountdown(300);
                setMensagem("⏳ PIX gerado. Realize o pagamento e aguarde a confirmação.");
            } else {
                const errorMessage = response?.error?.message || response?.message || "Não foi possível obter os dados do PIX.";
                setInternalError(`❌ ${errorMessage}`);
                setMensagem(`❌ ${errorMessage}`);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || `Ocorreu um erro inesperado no PIX.`;
            setInternalError(`❌ ${errorMessage}`);
            setMensagem(`❌ ${errorMessage}`);
        } finally {
            setInternalLoading(false);
        }
    };


    // verificarPagamentoManualPix (do SEGUNDO arquivo)
    const verificarPagamentoManualPix = async () => {
        if (!transactionId || !restauranteId) {
            setInternalError("Não é possível verificar o pagamento: dados incompletos.");
            return;
        }
        setInternalLoading(true);
        setInternalError(null);
        setMensagem("⏳ Verificando status do pagamento PIX...");
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/ObterPagamentoAsync/${transactionId}/${restauranteId}`
            );
            console.log("Resposta da verificação manual PIX:", response.data);
            const isApproved =
                response.data?.status === "approved" ||
                (response.data?.message && response.data.message.toLowerCase().includes("pedido ja existe")) ||
                (response.data?.message && response.data.message.toLowerCase().includes("pedido já existe"));


            if (isApproved) {
                setMensagem("✅ Pagamento PIX aprovado com sucesso!");
                 if (onPaymentSuccess) onPaymentSuccess(response.data);
                setTimeout(() => {
                    onClose();
                    navigate("/pedidos");
                }, 3000);
            } else {
                setMensagem("⏳ Pagamento PIX ainda não confirmado. Aguarde ou tente novamente.");
            }
        } catch (error) {
            console.error("Erro ao verificar status do PIX manual:", error);
            setInternalError("⚠️ Erro ao verificar pagamento PIX.");
            setMensagem("⚠️ Erro ao verificar pagamento PIX.");
        } finally {
            setInternalLoading(false);
        }
    };

    const verificarEstoquePedido = async (pedidoDTO) => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/1.0/Pedido/verificar-estoque-pedido`,
                pedidoDTO 
            );
            return response;
        } catch (err) {
            console.error("Erro ao verificar estoque:", err);
            return null;
        }   
    };
    // useEffect para countdown do PIX (do SEGUNDO arquivo)
    useEffect(() => {
        if (!pixData || countdown <= 0) {
            return;
        }
        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown, pixData]);


    const isLoading = paymentLoading || internalLoading;
    const displayError = paymentError || internalError; 

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={() => {
                if (!isLoading) { 
                    onClose();
                    setInternalError(null);
                    setMensagem("");
                    setPixData(null);
                    setTransactionId(null);
                    setPreferenceId(null);
                    setCountdown(300);
                    setPaymentSuccessState(false); // IMPORTANTE: Resetar o estado de sucesso ao fechar
                    setPaymentResponseData(null);
                }
            }}
            contentLabel="Modal de Pagamento"
            className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full mx-auto my-8 border border-gray-300 overflow-y-auto max-h-[90vh]"
            overlayClassName="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            shouldCloseOnOverlayClick={!isLoading}
            appElement={document.getElementById('root') || undefined}
        >
            {isLoading && <FuturisticLoadingSpinner 
                            message={
                                paymentMethod === 'pix' && pixData ? "Verificando pagamento PIX..." :
                                internalLoading ? "Processando..." :
                                "Carregando..."
                            }
                            accentColor="blue"
                            secondaryColor="blue" 
                            darkMode={false}
                            showBorder={false}
                            phaseMessages={
                                paymentMethod === 'pix' && pixData ? 
                                ["Aguardando confirmação", "Verificando...", "Atualizando..."] :
                                ["Verificando dados", "Processando...", "Finalizando..."]
                            }
                          />}

            {paymentSuccessState ? (
            // TELA DE SUCESSO DEDICADA
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                <p className="text-5xl">✅</p>
                <h3 className="text-xl font-semibold text-gray-800">Pagamento Aprovado!</h3>
                <p className="text-gray-700">{mensagem}</p>
                <p className="text-sm text-gray-500 mt-2">Você será redirecionado em alguns instantes...</p>
            </div>
        ) : (
            // TELA NORMAL DE PAGAMENTO (seu conteúdo original)
            <div className="space-y-4">
                 {/* Lógica de renderização para CARTAO (como no PRIMEIRO arquivo) */}
                {paymentMethod === "cartao" && (
                    <CardPaymentForm 
                        amount={amount}
                        onSubmit={handleCardPaymentSubmit}
                        onClose={onClose}
                        isLoading={isLoading}
                        ErrorMessage={mensagem}
                    />
                )}

                {/* Lógica de renderização para PIX */}
                {paymentMethod === "pix" && !pixData && !internalError && (
                    <PixForm 
                        amount={amount}
                        onSubmit={handlePixSubmit}
                        errorMessage={mensagem}
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
                        onVerificarPagamento={verificarPagamentoManualPix}
                        mensagemGlobal={mensagem} 
                        isLoading={isLoading} 
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
                        errorMessage={mensagem}
                    />
                )}
                {/* Lógica de renderização para MERCADOPAGO Wallet (como no PRIMEIRO arquivo) */}
                {paymentMethod === "mercadopago" && (
                     <MercadoPagoWalletButton 
                        preferenceId={preferenceId}
                        isLoading={isLoading} // isLoading já inclui internalLoading da geração da preferência
                        onClose={onClose}
                    />
                )}

                {/* {displayError && !isLoading && (
                    <p className="text-red-600 text-center mt-4 bg-red-100 p-3 rounded border border-red-300 text-sm">
                        {typeof displayError === 'object' ? JSON.stringify(displayError) : displayError}
                    </p>
                )}
                */}
                {/* {mensagem && !displayError && !isLoading && (
                     <div className={`text-center mt-4 p-3 rounded border text-sm ${
                        mensagem.includes("✅") ? "bg-green-100 border-green-300 text-green-700" :
                        mensagem.includes("⚠️") ? "bg-yellow-100 border-yellow-300 text-yellow-700" :
                        "bg-blue-100 border-blue-300 text-blue-700" 
                     }`}>
                        {mensagem}
                    </div>
                )} */}
            </div>
        )}
        </Modal>
    );
};

export default PaymentModal;