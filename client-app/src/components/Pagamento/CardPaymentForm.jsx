import React, { useEffect, useState } from "react";
import { CardPayment } from "@mercadopago/sdk-react";

const CardPaymentForm = ({ amount, onSubmit, onClose, isLoading }) => {
    const [isReady, setIsReady] = useState(false);
    const [initError, setInitError] = useState(null);

    useEffect(() => {
        console.log("=== CARD PAYMENT FORM INIT ===");
        console.log("Amount:", amount);
        console.log("MercadoPago disponível:", !!window.MercadoPago);
        
        // Verificar se o MercadoPago está realmente pronto
        const checkMercadoPagoReady = () => {
            if (window.MercadoPago) {
                console.log("✅ MercadoPago está disponível, aguardando estabilização...");
                
                // Aguardar um pouco mais para garantir que está estável
                setTimeout(() => {
                    console.log("✅ CardPayment pronto para renderizar");
                    setIsReady(true);
                    setInitError(null);
                }, 500);
            } else {
                console.error("❌ MercadoPago não está disponível");
                setInitError("Sistema de pagamento não foi inicializado corretamente");
                setIsReady(false);
            }
        };
        
        // Verificar imediatamente e depois de um tempo
        checkMercadoPagoReady();
        
        // Fallback: tentar novamente após 1 segundo se não estiver pronto
        const fallbackTimeout = setTimeout(() => {
            if (!isReady && window.MercadoPago) {
                console.log("🔄 Tentativa de fallback para inicialização");
                checkMercadoPagoReady();
            }
        }, 1000);

        return () => {
            clearTimeout(fallbackTimeout);
            // ⚠️ Deixe o unmount fora até resolver:
            // window.cardPaymentBrickController?.unmount?.();
        };
    }, [amount]);

    const cardPaymentInitialization = {
        amount: parseFloat(amount) || 1,
    };

    const cardPaymentCustomization = {
        visual: {
            style: {
                theme: 'default'
            }
        },
        paymentMethods: {
            maxInstallments: 10,
        },
            fields: {
                cardholderName: {
                    id: 'form-cardholder-name',
                    placeholder: 'Nome do titular',
                    label: 'Nome do titular do cartão',
                    required: true
            }
        }
    }

    const handleSubmit = (formData, additionalData) => {
        onSubmit(formData, additionalData);
    };

    const handleError = (error) => {
        // Verificar tipos específicos de erro
        if (error?.cause === 'fields_setup_failed_after_3_tries') {
            setInitError("Falha na conexão com os campos seguros. Tente recarregar a página.");
        } else if (error?.message?.includes('PUBLIC_KEY')) {
            setInitError("Erro de configuração da chave pública.");
        } else {
            console.error("Erro genérico no CardPayment:", error);
        }
    };
    // Loading state enquanto não está pronto
    if (!isReady && !initError) {
        return (
            <div className="mb-4">
                <div className="text-center p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600">Carregando formulário de cartão...</p>
                    <p className="text-xs text-gray-500 mt-2">
                        Conectando aos serviços seguros do Mercado Pago
                    </p>
                </div>
                
                <div className="flex justify-center mt-6">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    // Error state
    if (initError) {
        return (
            <div className="mb-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Erro no Sistema de Pagamento
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>{initError}</p>
                            </div>
                            <div className="mt-3">
                                <button
                                    onClick={() => {
                                        setInitError(null);
                                        setIsReady(false);
                                        // Tentar reinicializar
                                        setTimeout(() => {
                                            if (window.MercadoPago) {
                                                setIsReady(true);
                                            }
                                        }, 500);
                                    }}
                                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition"
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-center mt-6">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    // Formulário principal - só renderiza quando tudo está pronto
    return (
        <div className="mb-4">
            <p className="text-gray-700 text-center mb-4">Insira os dados do cartão:</p>
            
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                ✅ Sistema de pagamento carregado | Valor: R$ {parseFloat(amount).toFixed(2)}
            </div>
            
            <CardPayment
                initialization={cardPaymentInitialization}
                customization={cardPaymentCustomization}
                onSubmit={handleSubmit}
                onError={handleError}
            />
            
            <div className="flex justify-center mt-6">
                <button
                    onClick={onClose}
                    type="button"
                    className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200 disabled:opacity-50"
                    disabled={isLoading}
                >
                    Voltar
                </button>
            </div>
        </div>
    );
};

export default CardPaymentForm;