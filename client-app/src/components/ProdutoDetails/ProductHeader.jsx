import React from 'react';
import { X } from 'lucide-react';

const ProductHeader = () => {
    return (
        <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm p-4 flex justify-between items-center z-20">
            <button
                type="button"
                onClick={() => window.history.back()}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
            >
                <X size={24} className="text-gray-600 hover:text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Detalhes do produto</h1>
            <div className="w-6"></div>
        </header>
    );
};

export default ProductHeader;