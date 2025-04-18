import React from 'react';
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
    // Renderizar diretamente os grupos de complementos sem o cabeçalho "Complementos"
    return (
        <div className="mb-6">
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
    );
};

export default ComplementosSection;