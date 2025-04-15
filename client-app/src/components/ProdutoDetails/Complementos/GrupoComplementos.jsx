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
    const isSingleChoice = minQuantity <= 1;

    // Define o texto de informação do grupo
    let infoText = '';

    if (grupo.obrigatorio) {
        infoText += '(Obrigatório';
        if (minQuantity > 0) {
            infoText += `, mín: ${minQuantity}`;
        }
        if (grupo.quantidadeMaxima) {
            infoText += `, máx: ${grupo.quantidadeMaxima}`;
        }
        infoText += ')';
    } else {
        if (minQuantity === 1 || (minQuantity === 0 && isSingleChoice)) {
            infoText = '(No máximo 1)';
        } else if (grupo.quantidadeMaxima) {
            infoText = `(Máx: ${grupo.quantidadeMaxima})`;
        } else if (minQuantity > 1 || !isSingleChoice) {
            const quantidadeMaximaTotal = calcularQuantidadeMaximaGrupo(grupo.complementos);
            infoText = `(Máx: ${quantidadeMaximaTotal})`;
        }
    }

   

    return (
        <div className="mb-4 border-b pb-4">
            <button
                type="button"
                className="w-full py-3 bg-gray-50 rounded-lg flex justify-between items-center px-4 hover:bg-gray-100 transition-colors"
                onClick={() => toggleGrupo(grupo.id)}
            >
                <div>
                    <span className="font-semibold text-gray-800">{grupo.nome}</span>
                    {infoText && (
                        <span className="ml-2 text-sm text-gray-500">
                            {infoText}
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isOpen && (
                <div className="mt-3 space-y-3 pl-4">
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
                                currentQuantity={selectedExtrasQuantities[complemento.id] || 0}
                                onQuantityChange={handleQuantityChange}
                            />
                        ))
                    }
                </div>
            )}
        </div>
    );
};

export default GrupoComplementos;