import React from 'react';

const AddToCartButton = ({ onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="bg-blue-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
            Adicionar ao carrinho
        </button>
    );
};

export default AddToCartButton;