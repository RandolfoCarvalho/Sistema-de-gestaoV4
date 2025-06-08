import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../../Context/StoreContext';

export const useProductData = (productId) => {
    const [product, setProduct] = useState(null);
    const [gruposComplementos, setGruposComplementos] = useState([]);
    const [gruposAdicionais, setGruposAdicionais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedExtrasQuantities, setSelectedExtrasQuantities] = useState({});
    const [selectedRadioComplementos, setSelectedRadioComplementos] = useState({});
    const [complementosOpen, setComplementosOpen] = useState(true);
    const [adicionaisOpen, setAdicionaisOpen] = useState(true);
    const [gruposAdicionaisOpen, setGruposAdicionaisOpen] = useState({});
    const [gruposComplementosOpen, setGruposComplementosOpen] = useState({});
    const { currentStore } = useStore();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [productResponse, gruposComplementosResponse, gruposAdicionaisResponse] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Produto/ObterProduto/${productId}`),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Complemento/ListarGrupoComplementosPorLoja/${currentStore}/${productId}`),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Adicional/ListarGrupoAdicionaisPorLoja/${currentStore}/${productId}`)
                ]);

                setProduct(productResponse.data);

                const complementos = gruposComplementosResponse.data || [];
                console.log("complementos: " + gruposComplementosResponse.data)
                setGruposComplementos(complementos);

                const adicionais = gruposAdicionaisResponse.data || [];
                setGruposAdicionais(adicionais);
                console.log("adicionais: " + adicionais.data)
                // Inicializa estados de visibilidade
                initializeOpenStates(complementos, adicionais);
                // Inicializa estados de seleção
                initializeSelectionStates(complementos, adicionais);

                setError(null);
            } catch (error) {
                console.error('Erro ao buscar dados do produto:', error);
                setError('Erro ao carregar os dados do produto');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId, currentStore]);

    const initializeOpenStates = (complementos, adicionais) => {
        // Inicializa estados de visibilidade para grupos de adicionais
        const initialOpenStateAdicionais = {};
        adicionais.forEach(grupo => {
            initialOpenStateAdicionais[grupo.id] = true;
        });
        setGruposAdicionaisOpen(initialOpenStateAdicionais);

        // Inicializa estados de visibilidade para grupos de complementos
        const initialOpenStateComplementos = {};
        complementos.forEach(grupo => {
            initialOpenStateComplementos[grupo.id] = true;
        });
        setGruposComplementosOpen(initialOpenStateComplementos);
    };

    const initializeSelectionStates = (complementos, adicionais) => {
        const initialQuantities = {};

         // Adiciona prefixo para ADICIONAIS
        adicionais.forEach(grupo => {
            if (grupo.adicionais && grupo.adicionais.length > 0) {
                grupo.adicionais.forEach(adicional => {
                    const key = `adicional_${adicional.id}`; // <-- MUDANÇA
                    initialQuantities[key] = 0;
                });
            }
        });

        // Adiciona prefixo para COMPLEMENTOS
        complementos.forEach(grupo => {
            if (grupo.multiplaEscolha) {
                if (grupo.complementos && grupo.complementos.length > 0) {
                    grupo.complementos.forEach(complemento => {
                        const key = `complemento_${complemento.id}`; // <-- MUDANÇA
                        initialQuantities[key] = 0;
                    });
                }
            }
        });

        setSelectedExtrasQuantities(initialQuantities);

        // Inicializa seleções para complementos de escolha única
        const initialRadioSelections = {};
        complementos.forEach(grupo => {
            if ((grupo.quantidadeMinima || 0) <= 1) {
                initialRadioSelections[grupo.id] = null;
            }
        });
        setSelectedRadioComplementos(initialRadioSelections);
    };

    const toggleGrupoAdicional = (grupoId) => {
        setGruposAdicionaisOpen(prev => ({
            ...prev,
            [grupoId]: !prev[grupoId]
        }));
    };

    const toggleGrupoComplemento = (grupoId) => {
        setGruposComplementosOpen(prev => ({
            ...prev,
            [grupoId]: !prev[grupoId]
        }));
    };

    const handleQuantityChange = (item, increment, type) => { // <-- MUDANÇA: adicionado 'type'
        // Cria a chave única com o prefixo
        const uniqueKey = `${type}_${item.id}`; // <-- MUDANÇA

        setSelectedExtrasQuantities(prev => {
            const currentQuantity = prev[uniqueKey] || 0; // <-- MUDANÇA: usa a chave única
            const maxQuantity = item.maximoPorProduto || 1;
            let newQuantity;

            if (increment) {
                newQuantity = Math.min(currentQuantity + 1, maxQuantity);
            } else {
                newQuantity = Math.max(0, currentQuantity - 1);
            }
            
            const newQuantities = { ...prev };

            if (newQuantity > 0) {
                newQuantities[uniqueKey] = newQuantity; // <-- MUDANÇA: atualiza a chave única
            } else {
                delete newQuantities[uniqueKey]; // Opcional, mas bom para limpar o estado
            }

            return newQuantities;
        });
    };

    const handleRadioComplementoChange = (grupoId, complementoId) => {
        setSelectedRadioComplementos(prev => ({
            ...prev,
            [grupoId]: complementoId
        }));
    };

    return {
        product,
        gruposComplementos,
        gruposAdicionais,
        loading,
        error,
        selectedExtrasQuantities,
        selectedRadioComplementos,
        complementosOpen,
        adicionaisOpen,
        setComplementosOpen,
        setAdicionaisOpen,
        gruposAdicionaisOpen,
        gruposComplementosOpen,
        toggleGrupoAdicional,
        toggleGrupoComplemento,
        handleQuantityChange,
        handleRadioComplementoChange
    };
};