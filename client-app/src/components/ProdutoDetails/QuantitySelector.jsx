import React from 'react';
import { Plus, Minus } from 'lucide-react';

const QuantitySelector = ({ quantity, onIncrement, onDecrement }) => {
    return (
        <div className="flex items-center justify-center space-x-6 mt-8">
            <button
                type="button"
                onClick={onDecrement}
                className="w-12 h-12 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
                <Minus size={20} />
            </button>
            <span className="text-2xl font-bold text-gray-800 w-12 text-center">{quantity}</span>
            <button
                type="button"
                onClick={onIncrement}
                className="w-12 h-12 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
                <Plus size={20} />
            </button>
        </div>
    );
};

export default QuantitySelector;