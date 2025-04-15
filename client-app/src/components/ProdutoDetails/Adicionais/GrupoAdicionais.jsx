import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import AdicionalItem from "./AdicionalItem";

const GrupoAdicionais = ({ grupo, selectedExtrasQuantities, handleQuantityChange }) => {
    const [isOpen, setIsOpen] = useState(true);

    if (!grupo.adicionais || grupo.adicionais.length === 0) return null;

    return (
        <div className="grupo-adicionais border-b pb-4 mb-4">
            <button
                className="w-full flex justify-between items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-semibold">{grupo.nome} (Máx: {grupo.quantidadeMaxima})</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isOpen && (
                <div className="mt-3 space-y-2 pl-4">
                    {grupo.adicionais.map((adicional) => (
                        <AdicionalItem
                            key={adicional.id}
                            adicional={adicional}
                            quantity={selectedExtrasQuantities[adicional.id] || 0}
                            handleQuantityChange={handleQuantityChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GrupoAdicionais;
