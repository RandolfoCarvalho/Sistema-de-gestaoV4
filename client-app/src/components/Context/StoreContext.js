import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../axiosConfig';
const StoreContext = createContext();

export function StoreProvider({ children }) {
    const [currentStore, setCurrentStore] = useState(() => {
        const savedStore = localStorage.getItem('currentStore');
        return savedStore || '';
    });
    const [storeInfo, setStoreInfo] = useState(null);
    useEffect(() => {
        if (currentStore) {
            localStorage.setItem('currentStore', currentStore);
            fetchStoreInfo(currentStore);
        }
    }, [currentStore]);

    const fetchStoreInfo = async (storeName) => {
        try {
            const response = await api.get(`/api/1.0/restaurante/GetRestauranteInfoByName/${storeName}`);
            setStoreInfo(response.data);
            console.log("Store info data" + JSON.stringify(response.data))
        } catch (error) {
            console.error('Erro ao obter informações da loja:', error);
            setStoreInfo(null);
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
            setCurrentStore(storeName);
        }
    };

    useEffect(() => {
        checkAndUpdateStoreFromURL();
    }, []);

    return (
        <StoreContext.Provider value={{
            currentStore,
            storeInfo,
            updateCurrentStore,
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
