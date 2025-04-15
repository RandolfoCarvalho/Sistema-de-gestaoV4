import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import GrupoComplementos from './GrupoComplementos';

const ComplementosSection = ({
    gruposComplementos,
    isOpen,
    setIsOpen,
    gruposOpen,
    toggleGrupo,
    selectedRadioComplementos,
    handleRadioChange,
    selectedExtrasQuantities,
    handleQuantityChange
}) => {
    return (
        <div className="mb-6">
            <button
                type="button"
                className="w-full py-4 bg-gray-100 rounded-xl flex justify-between items-center px-4 hover:bg-gray-200 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-semibold text-gray-800">Complementos</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isOpen && (
                <div className="mt-3">
                    {gruposComplementos.map(grupo => (
                        <GrupoComplementos
                            key={grupo.id}
                            grupo={grupo}
                            isOpen={gruposOpen[grupo.id]}
                            toggleGrupo={toggleGrupo}
                            selectedRadioComplementos={selectedRadioComplementos}
                            handleRadioChange={handleRadioChange}
                            selectedExtrasQuantities={selectedExtrasQuantities}
                            handleQuantityChange={handleQuantityChange}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ComplementosSection;