import React from "react";
import { Plus, Minus } from "lucide-react";

const AdicionalItem = ({ adicional, quantity, handleQuantityChange }) => {
    const isAvailable = adicional.ativo !== false;
    const maxQuantity = adicional.maximoPorProduto || 1;

    return (
        <div className="adicional-item flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
            <div className="flex-1">
                <span className="font-medium">{adicional.nome}</span>
                {adicional.descricao && <p className="text-sm text-gray-500">{adicional.descricao}</p>}
                {adicional.precoBase > 0 && <p className="text-sm text-blue-600">+ R$ {adicional.precoBase.toFixed(2)}</p>}
            </div>

            <div className="flex items-center gap-2">
                <button
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
                    onClick={() => handleQuantityChange(adicional, false, 'adicional')} // <-- MUDANÇA
                    disabled={quantity === 0 || !isAvailable}
                    
                >
                    <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center">{quantity}</span>
                <button
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
                    onClick={() => handleQuantityChange(adicional, true, 'adicional')}
                    disabled={quantity >= maxQuantity || !isAvailable}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default AdicionalItem;
