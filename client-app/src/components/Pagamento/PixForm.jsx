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
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Pagamento PIX</h3>
                <p className="text-gray-600 text-sm">Preencha os dados para gerar o QR Code PIX</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                        type="text"
                        value={payerFirstName}
                        onChange={(e) => setPayerFirstName(e.target.value)}
                        required
                        className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-colors"
                        placeholder="Digite seu nome"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
                    <input
                        type="text"
                        value={payerLastName}
                        onChange={(e) => setPayerLastName(e.target.value)}
                        required
                        className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-colors"
                        placeholder="Digite seu sobrenome"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input
                        type="email"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        required
                        className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 rounded-md transition-colors"
                        placeholder="exemplo@email.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor a pagar</label>
                    <input
                        type="text"
                        value={`R$ ${parseFloat(amount || 0).toFixed(2)}`}
                        readOnly
                        className="w-full border border-green-300 p-3 rounded-md bg-green-50 text-lg font-semibold text-green-700 text-center"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        type="button"
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                        disabled={isLoading}
                    >
                        Voltar
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        disabled={isLoading}
                    >
                        {isLoading ? "Gerando..." : "Gerar PIX"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PixForm;