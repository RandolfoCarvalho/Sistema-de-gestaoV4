import React from 'react';
import { Check } from 'lucide-react';

const SingleChoiceItem = ({ item, grupo, isSelected, onSelect }) => {
    const disponivel = item.ativo !== false;
    const price = item.preco || 0;

    return (
        <div
            className={`flex items-center justify-between p-3 rounded-lg shadow-sm mb-2 cursor-pointer ${isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-white'}`}
            onClick={() => disponivel && onSelect(grupo.id, item.id)}
        >
            <div className="flex items-center flex-1">
                <div className="mr-3">
                    {isSelected ? (
                        <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center bg-blue-500">
                            <Check size={16} className="text-white" />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                    )}
                </div>
                <div className="flex-1">
                    <span className="font-medium">{item.nome}</span>
                    {item.descricao && (
                        <p className="text-sm text-gray-500">{item.descricao}</p>
                    )}
                </div>
            </div>
            {price > 0 && (
                <span className="text-sm text-blue-600 font-medium">+ R$ {price.toFixed(2)}</span>
            )}
        </div>
    );
};

export default SingleChoiceItem;