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
        let unitPrice = product.precoVenda || 0;
        // 2. Itera sobre os complementos de ESCOLHA ÚNICA (radio)
        gruposComplementos.forEach(grupo => {
            // Apenas grupos que NÃO são de múltipla escolha e têm uma seleção
            if (!grupo.multiplaEscolha && selectedRadioComplementos[grupo.id]) {
                const selectedId = selectedRadioComplementos[grupo.id];
                const complemento = grupo.complementos.find(c => c.id === selectedId);
                if (complemento) {
                    unitPrice += complemento.preco || 0;
                }
            }
        });

        // 3. Itera sobre os itens de MÚLTIPLA ESCOLHA (complementos e adicionais)
        Object.entries(selectedExtrasQuantities).forEach(([key, itemQuantity]) => {
            if (itemQuantity > 0) {
                console.log(`Analisando chave: ${key}, Quantidade: ${itemQuantity}`); // LOG

                const [type, id] = key.split('_');
                const numericId = parseInt(id, 10);
                let item = null;

                if (type === 'complemento') {
                    item = gruposComplementos.flatMap(g => g.complementos).find(c => c.id === numericId);
                    if (item) console.log(`Encontrado COMPLEMENTO: ${item.nome}, Preço: ${item.preco}`); // LOG
                } else if (type === 'adicional') {
                    item = gruposAdicionais.flatMap(g => g.adicionais).find(a => a.id === numericId);
                }

                if (item) {
                    const itemPrice = item.preco ?? item.precoAdicional ?? item.precoBase ?? 0;
                    unitPrice += itemPrice * itemQuantity;
                } else {
                    console.warn(`Item com chave ${key} não foi encontrado nos dados.`); // LOG
                }
            }
        });

        return unitPrice * quantity;

}, [product, gruposComplementos, gruposAdicionais, selectedExtrasQuantities, selectedRadioComplementos, quantity]);

    const handleAddToCartWithValidation = useCallback(() => {
        // A lógica de validação de grupos obrigatórios pode permanecer a mesma.
        const gruposObrigatoriosNaoAtendidos = gruposComplementos.filter(grupo => {
            if (!grupo.obrigatorio) return false;
            if (!grupo.multiplaEscolha) {
                return (grupo.quantidadeMinima >= 1 && !selectedRadioComplementos[grupo.id]);
            }
            if (grupo.multiplaEscolha) {
                const totalSelecionadoNoGrupo = grupo.complementos.reduce((acc, comp) => {
                    const key = `complemento_${comp.id}`;
                    return acc + (selectedExtrasQuantities[key] || 0);
                }, 0);
                return totalSelecionadoNoGrupo < (grupo.quantidadeMinima || 0);
            }
            return false;
        });

        if (gruposObrigatoriosNaoAtendidos.length > 0) {
            Swal.fire({
                title: "Seleção obrigatória!",
                text: `Por favor, atenda aos requisitos do(s) grupo(s): ${gruposObrigatoriosNaoAtendidos
                    .map((g) => g.nome)
                    .join(", ")}`,
                icon: "warning",
                confirmButtonText: "OK",
                confirmButtonColor: "#d33",
            });
            return;
        }

        // --- Coleta os complementos e adicionais selecionados ---
        const selectedItems = [];

        // 1. Coleta complementos de escolha única (radio)
        // Esta parte já estava correta.
        gruposComplementos.forEach(grupo => {
            if (!grupo.multiplaEscolha && selectedRadioComplementos[grupo.id]) {
                const selectedId = selectedRadioComplementos[grupo.id];
                const complemento = grupo.complementos.find(c => c.id === selectedId);
                if (complemento) {
                    selectedItems.push({ ...complemento, quantity: 1, grupoNome: grupo.nome });
                }
            }
        });
        // 2. Coleta itens de múltipla escolha (complementos e adicionais)
        // AQUI ESTÁ A CORREÇÃO SIMPLIFICADA
        Object.entries(selectedExtrasQuantities).forEach(([key, itemQuantity]) => {
            if (itemQuantity > 0) {
                const [type, id] = key.split('_');
                const numericId = parseInt(id, 10);
                let itemData = null;
                let grupoNome = '';

                if (type === 'complemento') {
                    // Achatamos a lista de todos os complementos para encontrar o item
                    itemData = gruposComplementos.flatMap(g => g.complementos).find(c => c.id === numericId);
                    // Encontramos o grupo pai depois de achar o item
                    const grupoPai = gruposComplementos.find(g => g.complementos.some(c => c.id === numericId));
                    if (grupoPai) grupoNome = grupoPai.nome;

                } else if (type === 'adicional') {
                    // Achatamos a lista de todos os adicionais para encontrar o item
                    itemData = gruposAdicionais.flatMap(g => g.adicionais).find(a => a.id === numericId);
                    // Encontramos o grupo pai depois de achar o item
                    const grupoPai = gruposAdicionais.find(g => g.adicionais.some(a => a.id === numericId));
                    if (grupoPai) grupoNome = grupoPai.nome;
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

