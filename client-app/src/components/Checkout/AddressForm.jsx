import React, { useState } from 'react';
import { MapPin } from "lucide-react";

const AddressForm = ({ formData, setFormData }) => {
    const [errors, setErrors] = useState({});
    const cepRegex = /^\d{5}-?\d{3}$/;

    const validateField = (name, value) => {
        if (!value && name !== 'endereco.Complemento') {
            return 'Este campo é obrigatório';
        }
        if (name === 'endereco.CEP' && value) {
            if (!cepRegex.test(value)) {
                return 'CEP inválido. Use o formato: 12345-678';
            }
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const fieldName = name.replace('endereco.', '');
        let formattedValue = value;
        if (name === 'endereco.CEP' && value) {
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length > 5) {
                formattedValue = `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}`;
            } else {
                formattedValue = digitsOnly;
            }
        }

        setFormData((prev) => ({
            ...prev,
            endereco: {
                ...prev.endereco,
                [fieldName]: formattedValue
            }
        }));

        const error = validateField(name, formattedValue);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        setErrors(prev => ({
            ...prev,
            [name]: error
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rua <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="endereco.Logradouro"
                            value={formData.endereco?.Logradouro || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full p-3 border ${errors['endereco.Logradouro'] ? 'border-red-500' : 'border-gray-200'} rounded-lg`}
                        />
                        {errors['endereco.Logradouro'] && (
                            <p className="text-red-500 text-sm mt-1">{errors['endereco.Logradouro']}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="endereco.Numero"
                            value={formData.endereco?.Numero || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full p-3 border ${errors['endereco.Numero'] ? 'border-red-500' : 'border-gray-200'} rounded-lg`}
                        />
                        {errors['endereco.Numero'] && (
                            <p className="text-red-500 text-sm mt-1">{errors['endereco.Numero']}</p>
                        )}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bairro <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="endereco.Bairro"
                            value={formData.endereco?.Bairro || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full p-3 border ${errors['endereco.Bairro'] ? 'border-red-500' : 'border-gray-200'} rounded-lg`}
                        />
                        {errors['endereco.Bairro'] && (
                            <p className="text-red-500 text-sm mt-1">{errors['endereco.Bairro']}</p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cidade <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="endereco.Cidade"
                            value={formData.endereco?.Cidade || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full p-3 border ${errors['endereco.Cidade'] ? 'border-red-500' : 'border-gray-200'} rounded-lg`}
                        />
                        {errors['endereco.Cidade'] && (
                            <p className="text-red-500 text-sm mt-1">{errors['endereco.Cidade']}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CEP <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="endereco.CEP"
                            value={formData.endereco?.CEP || ''}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className={`w-full p-3 border ${errors['endereco.CEP'] ? 'border-red-500' : 'border-gray-200'} rounded-lg`}
                            placeholder="12345-678"
                            maxLength={9}
                        />
                        {errors['endereco.CEP'] && (
                            <p className="text-red-500 text-sm mt-1">{errors['endereco.CEP']}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddressForm;