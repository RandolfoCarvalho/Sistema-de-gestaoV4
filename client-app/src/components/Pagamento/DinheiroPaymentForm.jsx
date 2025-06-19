import React, { useState } from "react";

const DinheiroPaymentForm = ({ amount, troco, setTroco, onSubmit, onClose, isLoading, errorMessage }) => {
    // Estado para controlar se o campo de input customizado deve ser exibido
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Valores comuns de notas para oferecer como opção de troco
    const trocoOptions = [20, 50, 100, 200];
    
    // Converte o valor do pedido para número para garantir a comparação
    const amountAsNumber = parseFloat(amount || 0);

    // Função para lidar com o clique em um botão de opção
    const handleOptionClick = (value) => {
        // Se o usuário clicar na mesma opção novamente, desmarca (sem troco)
        if (troco === value.toString()) {
            setTroco("");
        } else {
            setTroco(value.toString());
        }
        // Esconde o input customizado se uma opção pré-definida for clicada
        setShowCustomInput(false);
    };

    // Função para lidar com o clique no botão "Outro Valor"
    const handleCustomClick = () => {
        setShowCustomInput(true);
        // Limpa o valor do troco para que o usuário possa digitar um novo
        setTroco("");
    };

    // ---- Estilos para os botões (para facilitar a leitura) ----
    const baseButtonClasses = "w-full text-center p-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400";
    const selectedClasses = "bg-blue-600 text-white border-blue-700";
    const defaultClasses = "bg-white text-gray-800 border-gray-300 hover:bg-gray-100";
    const disabledClasses = "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed";

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="text-center">
                <p className="text-lg font-semibold text-gray-800">Pagamento em Dinheiro</p>
                <p className="text-sm text-gray-600">Confirme o valor e, se necessário, selecione para qual nota precisa de troco.</p>
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Precisa de troco para?</label>
                <div className="grid grid-cols-3 gap-3">
                    {/* Mapeia as opções de notas comuns */}
                    {trocoOptions.map((value) => {
                        const isDisabled = value <= amountAsNumber;
                        const isSelected = troco === value.toString() && !showCustomInput;

                        return (
                            <button
                                key={value}
                                type="button"
                                disabled={isDisabled || isLoading}
                                onClick={() => handleOptionClick(value)}
                                className={`${baseButtonClasses} ${
                                    isDisabled ? disabledClasses : (isSelected ? selectedClasses : defaultClasses)
                                }`}
                            >
                                R$ {value}
                            </button>
                        );
                    })}
                    {/* Botão para valor customizado */}
                    <button
                        type="button"
                        onClick={handleCustomClick}
                        disabled={isLoading}
                        className={`${baseButtonClasses} col-span-3 ${
                            showCustomInput ? selectedClasses : defaultClasses
                        }`}
                    >
                        Outro Valor
                    </button>
                </div>
            </div>
            
            {/* Campo de input que aparece condicionalmente */}
            {showCustomInput && (
                <div>
                    <label htmlFor="troco" className="block text-sm font-medium text-gray-700">Digite o valor para troco (R$):</label>
                    <input
                        id="troco"
                        type="number"
                        step="0.01"
                        min={amountAsNumber.toFixed(2)} // O valor mínimo deve ser o do pedido
                        value={troco}
                        onChange={(e) => setTroco(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Maior que R$ ${amountAsNumber.toFixed(2)}`}
                        autoFocus
                    />
                </div>
            )}

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

export default DinheiroPaymentForm;