import React from "react";
import { Wallet } from "@mercadopago/sdk-react";

const MercadoPagoWalletButton = ({ preferenceId, isLoading, onClose }) => {
    return (
        <div className="text-center space-y-4">
            {isLoading && <p className="text-blue-600">Gerando link de pagamento...</p>}
            {preferenceId && !isLoading && (
                <>
                    <p className="text-gray-700">Clique abaixo para pagar com Mercado Pago:</p>
                    <div id="wallet_container" className="flex justify-center">
                        <Wallet
                            initialization={{ preferenceId: preferenceId }}
                            customization={{ texts:{ valueProp: 'smart_option' } }}
                            onReady={() => console.log("Wallet pronto!")}
                            onError={(error) => {
                                console.error("Erro no componente Wallet:", error);
                            }}
                        />
                    </div>
                </>
            )}
            <div className="flex justify-center mt-6">
                <button
                    onClick={onClose}
                    type="button"
                    className="px-5 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200 disabled:opacity-50"
                    disabled={isLoading && !preferenceId}
                >
                    Voltar
                </button>
            </div>
        </div>
    );
};

export default MercadoPagoWalletButton;