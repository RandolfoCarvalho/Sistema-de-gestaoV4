import React from 'react';

const ProductInfo = ({ name, price, description }) => {
    return (
        <>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{name}</h2>
            <p className="text-2xl font-bold text-blue-600 mb-4">
                R$ {price.toFixed(2)}
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
        </>
    );
};

export default ProductInfo;