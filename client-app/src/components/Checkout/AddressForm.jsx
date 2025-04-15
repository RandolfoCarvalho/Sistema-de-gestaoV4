import React, { useState } from 'react';
import { MapPin, CircleDollarSign, CreditCard, FileText } from 'lucide-react';

const AddressForm = ({ formData, setFormData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Extract the field name without the prefix
        const fieldName = name.replace('endereco.', '');

        setFormData((prev) => ({
            ...prev,
            endereco: {
                ...prev.endereco,
                [fieldName]: value
            }
        }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                <MapPin className="mr-2" size={24} /> Endereço de Entrega
            </h2>
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                        <input
                            type="text"
                            name="endereco.Logradouro"
                            value={formData.endereco?.Logradouro || ''}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-200 rounded-lg"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                        <input
                            type="text"
                            name="endereco.Numero"
                            value={formData.endereco?.Numero || ''}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-200 rounded-lg"
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                        <input
                            type="text"
                            name="endereco.Complemento"
                            value={formData.endereco?.Complemento || ''}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-200 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                        <input
                            type="text"
                            name="endereco.Bairro"
                            value={formData.endereco?.Bairro || ''}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-200 rounded-lg"
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                        <input
                            type="text"
                            name="endereco.Cidade"
                            value={formData.endereco?.Cidade || ''}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-200 rounded-lg"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                        <input
                            type="text"
                            name="endereco.CEP"
                            value={formData.endereco?.CEP || ''}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-200 rounded-lg"
                            required
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AddressForm;
