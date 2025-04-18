import React from 'react';
import { Minus, Plus } from 'lucide-react';

const QuantitySelector = ({ quantity, onIncrement, onDecrement }) => {
    return (
        <div className="flex items-center">
            <button
                onClick={onDecrement}
                disabled={quantity <= 1}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    quantity <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
                <Minus size={16} />
            </button>
            
            <span className="mx-6 text-lg font-medium w-6 text-center">{quantity}</span>
            
            <button
                onClick={onIncrement}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};

export default QuantitySelector;