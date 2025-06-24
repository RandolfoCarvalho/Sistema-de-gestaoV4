import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../axiosConfig';
const StoreContext = createContext();

export function StoreProvider({ children }) {
    const [currentStore, setCurrentStore] = useState(() => {
        const savedStore = localStorage.getItem('currentStore');
        return savedStore || '';
    });
    // Renomeei para seguir o padrão camelCase, mas é opcional
    const [fantasyName, setFantasyName] = useState(''); 
    const [storeInfo, setStoreInfo] = useState(null);
    const [taxaEntrega, setTaxaEntrega] = useState(0); 
    const [loadingStoreInfo, setLoadingStoreInfo] = useState(false);

    useEffect(() => {
        if (currentStore) {
            localStorage.setItem('currentStore', currentStore);
            fetchStoreInfo(currentStore);
        } else {
            setStoreInfo(null);
            setFantasyName('');
            setTaxaEntrega(0);
        }
    }, [currentStore]);

    const fetchStoreInfo = async (storeName) => {
        try {
            setLoadingStoreInfo(true);
            const response = await api.get(`/api/1.0/restaurante/GetRestauranteInfoByName/${storeName}`);
            const data = response.data;
            
            setStoreInfo(data);
            const nomeFantasiaDaApi = data?.empresa?.nomeFantasia;
            const taxaEntregaDaApi = data?.empresa?.taxaEntrega;
            setFantasyName(nomeFantasiaDaApi || ''); 
            setTaxaEntrega(taxaEntregaDaApi || 0);

        } catch (error) {
            console.error('Erro ao obter informações da loja:', error);
            setStoreInfo(null);
            setFantasyName('');
            setTaxaEntrega(0);
        } finally {
            setLoadingStoreInfo(false); 
        }
    };

    const updateCurrentStore = (storeName) => {
        setCurrentStore(storeName);
    };
    const checkAndUpdateStoreFromURL = () => {
        const pathname = window.location.pathname;
        const pathParts = pathname.split('/');
        const lojaIndex = pathParts.indexOf('loja');
        if (lojaIndex !== -1 && pathParts[lojaIndex + 1]) {
            const storeName = pathParts[lojaIndex + 1];
            if (storeName !== currentStore) { 
                setCurrentStore(storeName);
            }
        }
    };
    useEffect(() => {
        checkAndUpdateStoreFromURL();
    }, []);

    return (
        <StoreContext.Provider value={{
            currentStore,
            storeInfo,
            fantasyName,
            taxaEntrega,
            setCurrentStore,
            updateCurrentStore,
            loadingStoreInfo,
            checkAndUpdateStoreFromURL
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}