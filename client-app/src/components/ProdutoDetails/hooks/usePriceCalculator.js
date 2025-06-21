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

    const calculateTotalPrice = useCallback(() => {
        if (!product) return 0;
        let unitPrice = product.precoVenda || 0;

        gruposComplementos.forEach(grupo => {
            if (!grupo.multiplaEscolha && selectedRadioComplementos[grupo.id]) {
                const selectedId = selectedRadioComplementos[grupo.id];
                const complemento = grupo.complementos.find(c => c.id === selectedId);
                if (complemento) {
                    unitPrice += complemento.preco || 0;
                }
            }
        });

        Object.entries(selectedExtrasQuantities).forEach(([key, itemQuantity]) => {
            if (itemQuantity > 0) {
                const [type, id] = key.split('_');
                const numericId = parseInt(id, 10);
                let item = null;

                if (type === 'complemento') {
                    item = gruposComplementos.flatMap(g => g.complementos).find(c => c.id === numericId);
                } else if (type === 'adicional') {
                    item = gruposAdicionais.flatMap(g => g.adicionais).find(a => a.id === numericId);
                }
                if (item) {
                    const itemPrice = item.preco ?? item.precoAdicional ?? item.precoBase ?? 0;
                    unitPrice += itemPrice * itemQuantity;
                }
            }
        });
        return unitPrice * quantity;

    }, [product, gruposComplementos, gruposAdicionais, selectedExtrasQuantities, selectedRadioComplementos, quantity]);

    const handleAddToCartWithValidation = useCallback(() => {
        // --- VALIDAÇÃO ---
        for (const grupo of gruposComplementos) {
            // Caso 1: Grupo de ESCOLHA ÚNICA
            if (!grupo.multiplaEscolha) {
                if (grupo.obrigatorio && !selectedRadioComplementos[grupo.id]) {
                    Swal.fire({
                        title: "Seleção obrigatória!",
                        text: `Você precisa selecionar uma opção no grupo "${grupo.nome}".`,
                        icon: "warning",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#d33",
                    });
                    return; 
                }
            } 
            // Caso 2: Grupo de MÚLTIPLA ESCOLHA
            else {
                const minimoExigido = grupo.quantidadeMinima > 0 ? grupo.quantidadeMinima : (grupo.obrigatorio ? 1 : 0);

                if (minimoExigido === 0) continue;

                // CORREÇÃO: Volta a somar as quantidades dos itens
                const totalQuantidadeNoGrupo = grupo.complementos.reduce((acc, comp) => {
                    const key = `complemento_${comp.id}`;
                    return acc + (selectedExtrasQuantities[key] || 0); // Soma a quantidade
                }, 0);

                if (totalQuantidadeNoGrupo < minimoExigido) {
                    const mensagemMinimo = minimoExigido === 1 ? "pelo menos 1 item" : `no mínimo ${minimoExigido} itens`;
                    Swal.fire({
                        title: "Itens insuficientes!",
                        text: `O grupo "${grupo.nome}" exige a seleção de ${mensagemMinimo}. Você selecionou ${totalQuantidadeNoGrupo}.`,
                        icon: "warning",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#d33",
                    });
                    return; 
                }
            }
        }

        // --- SE A VALIDAÇÃO PASSAR, MONTA O ARRAY DE ITENS SELECIONADOS ---
        const selectedItems = [];

        gruposComplementos.forEach(grupo => {
            if (!grupo.multiplaEscolha && selectedRadioComplementos[grupo.id]) {
                const selectedId = selectedRadioComplementos[grupo.id];
                const complemento = grupo.complementos.find(c => c.id === selectedId);
                if (complemento) {
                    selectedItems.push({ ...complemento, quantity: 1, grupoNome: grupo.nome });
                }
            }
        });

        Object.entries(selectedExtrasQuantities).forEach(([key, itemQuantity]) => {
            if (itemQuantity > 0) {
                const [type, id] = key.split('_');
                const numericId = parseInt(id, 10);
                let itemData = null;
                let grupoNome = '';

                if (type === 'complemento') {
                    const grupoPai = gruposComplementos.find(g => g.complementos.some(c => c.id === numericId));
                    if (grupoPai) {
                        itemData = grupoPai.complementos.find(c => c.id === numericId);
                        grupoNome = grupoPai.nome;
                    }
                } else if (type === 'adicional') {
                    const grupoPai = gruposAdicionais.find(g => g.adicionais.some(a => a.id === numericId));
                    if (grupoPai) {
                        itemData = grupoPai.adicionais.find(a => a.id === numericId);
                        grupoNome = grupoPai.nome;
                    }
                }
                if (itemData) {
                    selectedItems.push({ ...itemData, quantity: itemQuantity, grupoNome: grupoNome });
                }
            }
        });
        
        addToCart(product, quantity, selectedItems);
        setShowCartModal(true);

    }, [product, gruposComplementos, gruposAdicionais, selectedExtrasQuantities, selectedRadioComplementos, quantity, addToCart, setShowCartModal]);

    return { calculateTotalPrice, handleAddToCartWithValidation };
};