import React from "react";

const DinheiroPaymentForm = ({ amount, troco, setTroco, onSubmit, onClose, isLoading, errorMessage }) => {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-gray-700 text-center">Confirme o valor e informe se precisará de troco.</p>

            {errorMessage && (
                <div className="text-red-600 text-center bg-red-100 p-3 rounded border border-red-300 text-sm">
                    {errorMessage}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Valor a pagar</label>
                <input
                    type="text"
                    value={`R$ ${parseFloat(amount || 0).toFixed(2)}`}
                    readOnly
                    className="w-full border border-gray-300 p-2 rounded mt-1 bg-gray-100 text-lg"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="troco" className="block text-sm font-medium text-gray-700">Troco para (R$):</label>
                <input
                    id="troco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={troco}
                    onChange={(e) => setTroco(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded mt-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Deixe em branco se não precisar"
                />
            </div>
            <div className="flex justify-between gap-4 pt-4">
                <button
                    onClick={onClose}
                    type="button"
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200 disabled:opacity-50"
                    disabled={isLoading}
                >
                    Voltar
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                >
                    {isLoading ? "Processando..." : "Confirmar Pedido"}
                </button>
            </div>
        </form>
    );
};

export default DinheiroPaymentForm;