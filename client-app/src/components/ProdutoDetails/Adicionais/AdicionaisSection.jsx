import React from "react";
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
    // Renderizar diretamente os grupos de adicionais sem o cabeçalho "Adicionais"
    return (
        <div className="mb-6">
            {gruposAdicionais.map(grupo => (
                <GrupoAdicionais
                    key={grupo.id}
                    grupo={grupo}
                    isOpen={gruposOpen[grupo.id]}
                    toggleGrupo={toggleGrupo}
                    selectedExtrasQuantities={selectedExtrasQuantities}
                    // Passa o handleQuantityChange modificado para o AdicionalItem usar
                    handleQuantityChange={(item, isIncrement) => handleQuantityChange(item, isIncrement, 'adicional')}
                />
            ))}
        </div>
    );
};

export default AdicionaisSection;