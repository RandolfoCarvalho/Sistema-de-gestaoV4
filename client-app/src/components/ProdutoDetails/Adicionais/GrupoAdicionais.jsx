import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import AdicionalItem from "./AdicionalItem";

const GrupoAdicionais = ({ grupo, selectedExtrasQuantities, handleQuantityChange }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!grupo.adicionais || grupo.adicionais.length === 0) return null;

    return (
        <div className="mb-4">
            <button
                type="button"
                className="w-full py-3 flex justify-between items-center hover:bg-gray-50 transition-colors rounded-lg"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div>
                    <div className="font-semibold text-gray-800">{grupo.nome}</div>
                    {grupo.quantidadeMaxima && (
                        <div className="text-xs text-gray-500 mt-1">
                            Escolha até {grupo.quantidadeMaxima}
                        </div>
                    )}
                </div>
                {isOpen ? 
                    <ChevronUp size={20} className="text-gray-500" /> : 
                    <ChevronDown size={20} className="text-gray-500" />
                }
            </button>

            {isOpen && (
                <div className="mt-2 space-y-3 pl-1">
                    {grupo.adicionais.map((adicional) => (
                        <AdicionalItem
                            key={adicional.id}
                            adicional={adicional}
                            // Lê a quantidade usando a chave com prefixo
                            quantity={selectedExtrasQuantities[`adicional_${adicional.id}`] || 0} // <-- MUDANÇA
                            handleQuantityChange={handleQuantityChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GrupoAdicionais;