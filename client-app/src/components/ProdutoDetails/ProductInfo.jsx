import React from 'react';

const ProductInfo = ({ name, price, description }) => {
    // Função para formatar o preço em reais brasileiros
    const formatPrice = (value) => {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    return (
        <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            <p className="text-lg font-semibold text-green-500 mt-1">{formatPrice(price)}</p>
            {description && (
                <p className="text-gray-600 text-sm mt-3 leading-relaxed">{description}</p>
            )}
        </div>
    );
};

export default ProductInfo;