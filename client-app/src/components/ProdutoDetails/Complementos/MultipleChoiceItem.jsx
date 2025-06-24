import { Plus, Minus } from 'lucide-react';

const MultipleChoiceItem = ({ item, isComplemento, currentQuantity, onQuantityChange, isGroupMaxReached }) => {
    const maxItemQuantity = item.maximoPorProduto || 1;
    const price = isComplemento ? item.preco : item.precoAdicional;
    const disponivel = item.ativo !== false;

    // CORREÇÃO: Simplifica a lógica de desabilitar novamente
    const isIncrementDisabled = 
        currentQuantity >= maxItemQuantity || 
        isGroupMaxReached || 
        !disponivel;

    return (
        <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
            <div className="flex-1">
                <span className="font-medium">{item.nome}</span>
                {item.descricao && (
                    <p className="text-sm text-gray-500">{item.descricao}</p>
                )}
                {price > 0 && (
                    <span className="text-sm text-blue-600"> R$ {price.toFixed(2)}</span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onQuantityChange(item, false)}
                    disabled={currentQuantity === 0 || !disponivel}
                >
                    <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center">{currentQuantity}</span>
                <button
                    type="button"
                    className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 active:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onQuantityChange(item, true)}
                    disabled={isIncrementDisabled}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default MultipleChoiceItem;