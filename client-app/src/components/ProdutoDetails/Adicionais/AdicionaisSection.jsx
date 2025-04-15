import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import GrupoAdicionais from "./GrupoAdicionais";

const AdicionaisSection = ({
    gruposAdicionais,
    isOpen,
    setIsOpen,
    gruposOpen,
    toggleGrupo,
    selectedExtrasQuantities,
    handleQuantityChange
}) => {
    // Garantir que a seção de adicionais esteja visível
    return (
        <div className="mb-6">
            <button
                type="button"
                className="w-full py-4 bg-gray-100 rounded-xl flex justify-between items-center px-4 hover:bg-gray-200 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-semibold text-gray-800">Adicionais</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isOpen && (
                <div className="mt-3">
                    {gruposAdicionais.map(grupo => (
                        <GrupoAdicionais
                            key={grupo.id}
                            grupo={grupo}
                            isOpen={gruposOpen[grupo.id]}
                            toggleGrupo={toggleGrupo}
                            selectedExtrasQuantities={selectedExtrasQuantities}
                            handleQuantityChange={handleQuantityChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdicionaisSection;
