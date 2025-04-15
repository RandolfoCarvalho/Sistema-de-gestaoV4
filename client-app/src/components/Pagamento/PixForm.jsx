import React from "react";

const PixForm = ({ amount, onSubmit, onClose, isLoading }) => {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <p className="text-gray-700 text-center">Confirme o valor para gerar o QR Code PIX.</p>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Valor a pagar</label>
                <input
                    type="text"
                    value={`R$ ${parseFloat(amount || 0).toFixed(2)}`}
                    readOnly
                    className="w-full border border-gray-300 p-2 rounded mt-1 bg-gray-100 text-lg"
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
                    {isLoading ? "Gerando..." : "Gerar PIX"}
                </button>
            </div>
        </form>
    );
};

export default PixForm;