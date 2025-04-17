import React, { useState } from "react";

const PixForm = ({ amount, onSubmit, onClose, isLoading }) => {
    const [payerFirstName, setPayerFirstName] = useState("");
    const [payerLastName, setPayerLastName] = useState("");
    const [payerEmail, setPayerEmail] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit({
            amount: parseFloat(amount),
            payerFirstName,
            payerLastName,
            payerEmail
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-700 text-center">Preencha os dados para gerar o QR Code PIX.</p>

            <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                    type="text"
                    value={payerFirstName}
                    onChange={(e) => setPayerFirstName(e.target.value)}
                    required
                    className="w-full border border-gray-300 p-2 rounded mt-1"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Sobrenome</label>
                <input
                    type="text"
                    value={payerLastName}
                    onChange={(e) => setPayerLastName(e.target.value)}
                    required
                    className="w-full border border-gray-300 p-2 rounded mt-1"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                    type="email"
                    value={payerEmail}
                    onChange={(e) => setPayerEmail(e.target.value)}
                    required
                    className="w-full border border-gray-300 p-2 rounded mt-1"
                />
            </div>

            <div>
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
