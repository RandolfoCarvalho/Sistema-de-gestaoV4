import React from 'react';
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

    // Função para calcular a soma das quantidades máximas 
    const calcularQuantidadeMaximaGrupo = (items) => {
        if (!items || items.length === 0) return 0;
        return items.reduce((total, item) => total + (item.maximoPorProduto || 1), 0);
    };
    const minQuantity = grupo.quantidadeMinima || 0;
    const isSingleChoice = !grupo.multiplaEscolha;

    // Define o texto de informação do grupo
    let infoText = '';

    if (grupo.obrigatorio) {
        infoText += 'Obrigatório';
        if (minQuantity > 0) {
            infoText += ` • Mín: ${minQuantity}`;
        }
        if (grupo.quantidadeMaxima) {
            infoText += ` • Máx: ${grupo.quantidadeMaxima}`;
        }
    } else {
        if (minQuantity === 1 || (minQuantity === 0 && isSingleChoice)) {
            infoText = 'Escolha até 1';
        } else if (grupo.quantidadeMaxima) {
            infoText = `Escolha até ${grupo.quantidadeMaxima}`;
        } else if (minQuantity > 1 || !isSingleChoice) {
            const quantidadeMaximaTotal = calcularQuantidadeMaximaGrupo(grupo.complementos);
            infoText = `Escolha até ${quantidadeMaximaTotal}`;
        }
    }

    return (
        <div className="mb-4">
            <button
                type="button"
                className="w-full py-3 flex justify-between items-center hover:bg-gray-50 transition-colors rounded-lg"
                onClick={() => toggleGrupo(grupo.id)}
            >
                <div>
                    <div className="font-semibold text-gray-800">{grupo.nome}</div>
                    {infoText && (
                        <div className="text-xs text-gray-500 mt-1">
                            {infoText}
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
                                // Lê a quantidade com a chave correta
                                currentQuantity={selectedExtrasQuantities[`complemento_${complemento.id}`] || 0}
                                // Passa uma função que já inclui o tipo 'complemento'
                                onQuantityChange={(item, isIncrement) => handleQuantityChange(item, isIncrement, 'complemento')}
                            />
                        ))
                    }
                </div>
            )}
        </div>
    );
};

export default GrupoComplementos;