import React from 'react';
import { Truck, Store } from 'lucide-react';

const DeliveryOptions = ({ formData, setFormData }) => {
    
    const handleDeliveryTypeChange = (type) => {
        setFormData(prev => ({
            ...prev,
            TipoEntrega: type,
        }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Como você quer receber?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                    onClick={() => handleDeliveryTypeChange('DELIVERY')}
                    className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center ${
                        formData.TipoEntrega === 'DELIVERY' 
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                        : 'border-gray-200 hover:border-indigo-400'
                    }`}
                >
                    <Truck className={`mr-3 ${formData.TipoEntrega === 'DELIVERY' ? 'text-indigo-600' : 'text-gray-500'}`} />
                    <div>
                        <p className="font-semibold text-gray-800">Entrega</p>
                        <p className="text-xs text-gray-500">Receba no seu endereço.</p>
                    </div>
                </div>

                <div
                    onClick={() => handleDeliveryTypeChange('RETIRADA')}
                    className={`p-4 border rounded-lg cursor-pointer transition-all flex items-center ${
                        formData.TipoEntrega === 'RETIRADA' 
                        ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                        : 'border-gray-200 hover:border-indigo-400'
                    }`}
                >
                    <Store className={`mr-3 ${formData.TipoEntrega === 'RETIRADA' ? 'text-indigo-600' : 'text-gray-500'}`} />
                    <div>
                        <p className="font-semibold text-gray-800">Retirar no Balcão</p>
                        <p className="text-xs text-gray-500">Você busca seu pedido na loja.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryOptions;