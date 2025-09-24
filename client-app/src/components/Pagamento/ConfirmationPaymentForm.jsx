import React from "react";

const ConfirmationPaymentForm = ({ amount, onSubmit, onClose, isLoading, paymentMethodLabel, errorMessage }) => {
    const amountAsNumber = parseFloat(amount || 0);

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">Confirmar Pedido</p>
                <p className="text-sm text-gray-600">
                    Você confirma que o pagamento será realizado via <strong>{paymentMethodLabel}</strong>?
                </p>
            </div>

            {errorMessage && (
                <div className="text-red-600 text-center bg-red-100 p-3 rounded-lg border border-red-300 text-sm">
                    {errorMessage}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">Valor a pagar</label>
                <div className="mt-1 text-2xl font-bold text-gray-900 bg-gray-100 p-3 rounded-lg text-center">
                    {`R$ ${amountAsNumber.toFixed(2).replace('.', ',')}`}
                </div>
            </div>

            <div className="flex justify-between gap-4 pt-4">
                <button
                    onClick={onClose}
                    type="button"
                    className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition duration-200 disabled:opacity-50"
                    disabled={isLoading}
                >
                    Voltar
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? "Processando..." : "Confirmar Pedido"}
                </button>
            </div>
        </form>
    );
};

export default ConfirmationPaymentForm;