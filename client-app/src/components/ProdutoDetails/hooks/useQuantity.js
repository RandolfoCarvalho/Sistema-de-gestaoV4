import { useState } from 'react';

export const useQuantity = (initialQuantity = 1) => {
    const [quantity, setQuantity] = useState(initialQuantity);

    const incrementQuantity = () => {
        setQuantity(prev => prev + 1);
    };

    const decrementQuantity = () => {
        setQuantity(prev => Math.max(1, prev - 1));
    };

    return {
        quantity,
        setQuantity,
        incrementQuantity,
        decrementQuantity
    };
};
