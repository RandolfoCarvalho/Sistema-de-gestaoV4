import React from 'react';

const ProductImage = ({ image, alt }) => {
    return (
        <div className="relative overflow-hidden w-full h-80 rounded-2xl shadow-lg mb-6">
            <img
                src={image || "/api/placeholder/400/300"}
                alt={alt}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
        </div>
    );
};

export default ProductImage;