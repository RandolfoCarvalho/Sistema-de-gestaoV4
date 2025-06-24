import { ChevronDown, ChevronUp } from 'lucide-react';
import SingleChoiceItem from './SingleChoiceItem';
import MultipleChoiceItem from './MultipleChoiceItem';

const GrupoComplementos = ({
    grupo,
    isOpen,
    toggleGrupo,
    selectedRadioComplementos,
    handleRadioChange,
    selectedExtrasQuantities,
    handleQuantityChange
}) => {
    if (!grupo.complementos || grupo.complementos.length === 0) {
        return null;
    }

    const minQuantity = grupo.quantidadeMinima || 0;
    const maxQuantity = grupo.quantidadeMaxima || 0;
    const isSingleChoice = !grupo.multiplaEscolha;

    const totalQuantidadeNoGrupo = isSingleChoice ? 0 : grupo.complementos.reduce((acc, comp) => {
        const key = `complemento_${comp.id}`;
        return acc + (selectedExtrasQuantities[key] || 0);
    }, 0);
    
    const isGroupMaxReached = maxQuantity > 0 && totalQuantidadeNoGrupo >= maxQuantity;

    let infoText = '';
    if (isSingleChoice) {
        infoText = grupo.obrigatorio ? 'Obrigatório • Escolha 1' : 'Escolha 1';
    } else {
        const parts = [];
        if (minQuantity > 0) {
            parts.push(`mín. ${minQuantity}`);
        }
        if (maxQuantity > 0) {
            parts.push(`máx. ${maxQuantity}`);
        }
        if (parts.length > 0) {
            infoText = (grupo.obrigatorio ? 'Obrigatório • ' : '') + `Escolha ${parts.join(' e ')} itens`;
        }
    }
    return (
        <div className="mb-4">
            <button
                type="button"
                className="w-full py-3 flex justify-between items-center hover:bg-gray-50 transition-colors rounded-lg"
                onClick={() => toggleGrupo(grupo.id)}
            >
                <div className="flex-grow text-left"> 
                    <div className="font-semibold text-gray-800">{grupo.nome}</div>
                    {infoText && (
                        <div className="text-xs text-gray-500 mt-1">
                            {infoText}
                            {!isSingleChoice && maxQuantity > 0 && ` (${totalQuantidadeNoGrupo} de ${maxQuantity} selecionados)`}
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
                    {isSingleChoice
                        ? grupo.complementos.map(complemento => (
                            <SingleChoiceItem
                                key={complemento.id}
                                item={complemento}
                                grupo={grupo}
                                isSelected={selectedRadioComplementos[grupo.id] === complemento.id}
                                onSelect={handleRadioChange}
                            />
                        ))
                        : grupo.complementos.map(complemento => (
                            <MultipleChoiceItem
                                key={complemento.id}
                                item={complemento}
                                isComplemento={true}
                                currentQuantity={selectedExtrasQuantities[`complemento_${complemento.id}`] || 0}
                                onQuantityChange={(item, isIncrement) => handleQuantityChange(item, isIncrement, 'complemento')}
                                isGroupMaxReached={isGroupMaxReached}
                            />
                        ))
                    }
                </div>
            )}
        </div>
    );
};

export default GrupoComplementos;