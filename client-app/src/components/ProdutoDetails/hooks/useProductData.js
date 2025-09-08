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
                setGruposComplementos(complementos);
                const adicionais = gruposAdicionaisResponse.data || [];
                setGruposAdicionais(adicionais);
                
                initializeOpenStates(complementos, adicionais);
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
        const initialOpenStateAdicionais = {};
        adicionais.forEach(grupo => {
            initialOpenStateAdicionais[grupo.id] = true;
        });
        setGruposAdicionaisOpen(initialOpenStateAdicionais);

        const initialOpenStateComplementos = {};
        complementos.forEach(grupo => {
            initialOpenStateComplementos[grupo.id] = true;
        });
        setGruposComplementosOpen(initialOpenStateComplementos);
    };

    const initializeSelectionStates = (complementos, adicionais) => {
        const initialQuantities = {};

        adicionais.forEach(grupo => {
            if (grupo.adicionais && grupo.adicionais.length > 0) {
                grupo.adicionais.forEach(adicional => {
                    const key = `adicional_${adicional.id}`;
                    initialQuantities[key] = 0;
                });
            }
        });

        complementos.forEach(grupo => {
            if (grupo.multiplaEscolha) {
                if (grupo.complementos && grupo.complementos.length > 0) {
                    grupo.complementos.forEach(complemento => {
                        const key = `complemento_${complemento.id}`;
                        initialQuantities[key] = 0;
                    });
                }
            }
        });

        setSelectedExtrasQuantities(initialQuantities);
        const initialRadioSelections = {};
        complementos.forEach(grupo => {
            if (!grupo.multiplaEscolha) {
                initialRadioSelections[grupo.id] = null;
            }
        });
        setSelectedRadioComplementos(initialRadioSelections);
    };

    const toggleGrupoAdicional = (grupoId) => {
        setGruposAdicionaisOpen(prev => ({ ...prev, [grupoId]: !prev[grupoId] }));
    };

    const toggleGrupoComplemento = (grupoId) => {
        setGruposComplementosOpen(prev => ({ ...prev, [grupoId]: !prev[grupoId] }));
    };

    const handleQuantityChange = (item, increment, type) => {
        const uniqueKey = `${type}_${item.id}`;

        setSelectedExtrasQuantities(prev => {
            if (increment && type === 'complemento') {
                const parentGroup = gruposComplementos.find(g => g.complementos.some(c => c.id === item.id));
                if (parentGroup && parentGroup.multiplaEscolha && parentGroup.quantidadeMaxima > 0) {
                    const totalQuantityInGroup = parentGroup.complementos.reduce((acc, comp) => {
                        return acc + (prev[`complemento_${comp.id}`] || 0);
                    }, 0);
                    
                    if (totalQuantityInGroup >= parentGroup.quantidadeMaxima) {
                        return prev;
                    }
                }
            }

            const currentQuantity = prev[uniqueKey] || 0;
            const maxItemQuantity = item.maximoPorProduto || 1;
            let newQuantity;
            if (increment) {
                newQuantity = Math.min(currentQuantity + 1, maxItemQuantity);
            } else {
                newQuantity = Math.max(0, currentQuantity - 1);
            }

            const newQuantities = { ...prev };
            if (newQuantity > 0) {
                newQuantities[uniqueKey] = newQuantity;
            } else {
                delete newQuantities[uniqueKey];
            }

            return newQuantities;
        });
    };

    const handleRadioComplementoChange = (grupoId, complementoId) => {
        setSelectedRadioComplementos(prev => ({
            ...prev,
            [grupoId]: prev[grupoId] === complementoId ? null : complementoId
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