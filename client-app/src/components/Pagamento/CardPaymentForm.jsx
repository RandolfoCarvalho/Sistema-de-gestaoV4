import React from "react";
import { CardPayment } from "@mercadopago/sdk-react";

const CardPaymentForm = ({ amount, onSubmit, onClose, isLoading, ErrorMessage }) => {
    const cardPaymentInitialization = {
        amount: parseFloat(amount) || 0,
    };
    
    //Customizar campos, caso eu queira no depois
    const cardPaymentCustomization = {
        visual: {
            style: {
                theme: 'default',
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
    };

    //Form do mp cuida dos campos
    return (
        <div className="mb-4">
            {/* ✅ Exibe a mensagem de erro se for do tipo "❌" */}
            {ErrorMessage && ErrorMessage.includes("❌") && (
                <div className="bg-red-100 text-red-700 border border-red-300 p-3 rounded mb-4 text-sm text-center">
                    {ErrorMessage}
                </div>
            )}
            <p className="text-gray-700 text-center mb-4">Insira os dados do cartão:</p>
            <CardPayment
                initialization={cardPaymentInitialization}
                customization={cardPaymentCustomization}
                onSubmit={onSubmit}
                onError={(error) => {
                    console.error("Erro DETALHADO no CardPayment:", JSON.stringify(error, null, 2));
                }}
                onReady={() => console.log("CardPayment pronto!")}
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