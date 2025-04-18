import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useStore } from './Context/StoreContext';

const ProtectedStore = () => {
    const { currentStore } = useStore(); 

    const navigate = useNavigate();


    if (!currentStore) {
            return (
                <div className="flex items-center justify-center h-screen bg-gray-100">
                    <div className="bg-white p-6 rounded-lg shadow text-center">
                        <h2 className="text-2xl font-semibold text-red-500 mb-4">Loja não encontrada</h2>
                        <p className="text-gray-600">Por favor, acesse a loja por um link válido.</p>
                        <button
                            className="mt-6 bg-blue-500 text-white px-4 py-2 rounded"
                            onClick={() => navigate('/')}
                        >
                            Voltar para o início
                        </button>
                    </div>
                </div>
            );
        }

    return <Outlet />;
};

export default ProtectedStore;
