import React from 'react';

const TotalPrice = ({ total }) => {
    return (
        <span className="text-xl font-bold text-gray-800">
            Total: R$ {total.toFixed(2)}
        </span>
    );
};

export default TotalPrice;