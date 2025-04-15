import { useCallback } from "react";
import Swal from "sweetalert2";

export const usePriceCalculator = (
    product,
    gruposComplementos,
    gruposAdicionais,
    selectedExtrasQuantities,
    selectedRadioComplementos,
    quantity,
    addToCart,
    setShowCartModal
) => {
    // Função auxiliar para pegar o preço correto do item
    const getItemPrice = (item, isComplemento) => {
        if (isComplemento) {
            return item.preco || 0;
        }
        return item.precoAdicional || item.precoBase || 0;
    };

    // Calcula o preço total do produto incluindo adicionais e complementos
    const calculateTotalPrice = useCallback(() => {
    if (!product) return 0;
    
    // Calcula o preço unitário do produto com seus complementos e adicionais
    let unitPrice = product.precoVenda;
    
    // Complementos de múltipla escolha
    gruposComplementos.forEach((grupo) => {
        if ((grupo.quantidadeMinima || 0) > 1 && grupo.complementos) {
            unitPrice += grupo.complementos.reduce((sum, item) => {
                const itemQuantity = selectedExtrasQuantities[item.id] || 0;
                return sum + getItemPrice(item, true) * itemQuantity;
            }, 0);
        }
    });
    
    // Complementos de escolha única (radio)
    gruposComplementos.forEach((grupo) => {
        if ((grupo.quantidadeMinima || 0) <= 1 && selectedRadioComplementos[grupo.id]) {
            const selectedComplemento = grupo.complementos.find(
                (c) => c.id === selectedRadioComplementos[grupo.id]
            );
            if (selectedComplemento) {
                unitPrice += getItemPrice(selectedComplemento, true);
            }
        }
    });
    
    // Adicionais
    gruposAdicionais.forEach((grupo) => {
        if (grupo.adicionais) {
            unitPrice += grupo.adicionais.reduce((sum, adicional) => {
                const itemQuantity = selectedExtrasQuantities[adicional.id] || 0;
                return sum + getItemPrice(adicional, false) * itemQuantity;
            }, 0);
        }
    });
    
    // Multiplica o preço unitário (produto + complementos + adicionais) pela quantidade
    return unitPrice * quantity;
}, [product, gruposComplementos, gruposAdicionais, selectedExtrasQuantities, selectedRadioComplementos, quantity]);

    // Adiciona o produto ao carrinho validando complementos obrigatórios
    const handleAddToCartWithValidation = useCallback(() => {
        const gruposObrigatorios = gruposComplementos.filter((grupo) => grupo.obrigatorio);

        const gruposNaoSelecionados = gruposObrigatorios.filter((grupo) => {
            if (grupo.quantidadeMinima === 1) {
                return !selectedRadioComplementos[grupo.id];
            }
            return !grupo.complementos.some((item) => selectedExtrasQuantities[item.id] > 0);
        });

        if (gruposNaoSelecionados.length > 0) {
            Swal.fire({
                title: "Seleção obrigatória!",
                text: `Por favor, selecione os complementos obrigatórios: ${gruposNaoSelecionados
                    .map((g) => g.nome)
                    .join(", ")}`,
                icon: "warning",
                confirmButtonText: "OK",
                confirmButtonColor: "#d33",
            });
            return;
        }

        // Coleta os complementos e adicionais selecionados
        const selectedExtras = [];

        // Complementos múltipla escolha
        gruposComplementos.forEach((grupo) => {
            if ((grupo.quantidadeMinima || 0) > 1 && grupo.complementos) {
                grupo.complementos.forEach((complemento) => {
                    if (selectedExtrasQuantities[complemento.id] > 0) {
                        selectedExtras.push({
                            ...complemento,
                            quantity: selectedExtrasQuantities[complemento.id],
                            grupoId: grupo.id,
                            grupoNome: grupo.nome,
                        });
                    }
                });
            }
        });

        // Complementos de escolha única (radio)
        gruposComplementos.forEach((grupo) => {
            if ((grupo.quantidadeMinima || 0) <= 1 && selectedRadioComplementos[grupo.id]) {
                const selectedComplemento = grupo.complementos.find(
                    (c) => c.id === selectedRadioComplementos[grupo.id]
                );
                if (selectedComplemento) {
                    selectedExtras.push({
                        ...selectedComplemento,
                        quantity: 1,
                        grupoId: grupo.id,
                        grupoNome: grupo.nome,
                    });
                }
            }
        });

        // Adicionais
        gruposAdicionais.forEach((grupo) => {
            grupo.adicionais.forEach((adicional) => {
                if (selectedExtrasQuantities[adicional.id] > 0) {
                    selectedExtras.push({
                        ...adicional,
                        quantity: selectedExtrasQuantities[adicional.id],
                        grupoId: grupo.id,
                        grupoNome: grupo.nome,
                    });
                }
            });
        });

        // Adiciona ao carrinho
        addToCart(product, quantity, selectedExtras);
        setShowCartModal(true);
    }, [gruposComplementos, selectedExtrasQuantities, selectedRadioComplementos, gruposAdicionais, quantity, addToCart, setShowCartModal]);

    return { calculateTotalPrice, handleAddToCartWithValidation };
};
