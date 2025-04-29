import React from 'react';
import { ShoppingCart } from 'lucide-react';

const AddToCartButton = ({ onClick }) => {
    return (
        <button
        onClick={onClick}
        className="bg-blue-500 hover:bg-red-600 text-white py-3 px-6 rounded-full font-medium flex items-center transition-colors"
        >
        <ShoppingCart size={18} className="mr-2" />
        Adicionar ao carrinho
        </button>
    );
};

export default AddToCartButton;