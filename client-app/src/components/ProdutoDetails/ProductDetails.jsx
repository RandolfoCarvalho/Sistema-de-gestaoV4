// src/components/ProductDetails/ProductDetails.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import HeaderPublic from '../HeaderPublic/HeaderPublic';
import ProductImage from './ProductImage';
import ProductInfo from './ProductInfo';
import QuantitySelector from './QuantitySelector';
import TotalPrice from './TotalPrice';
import AddToCartButton from './AddToCartButton';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import ComplementosSection from './Complementos/ComplementosSection';
import AdicionaisSection from './Adicionais/AdicionaisSection';
import { useCart } from '../Carrinho/CartContext';
import CartActionModal from '../Carrinho/CartActionModal';
import { useProductData } from './hooks/useProductData';
import { useQuantity } from './hooks/useQuantity';
import { usePriceCalculator } from './hooks/usePriceCalculator';

const ProductDetails = () => {
    const { id } = useParams();
    const {
        product,
        gruposComplementos,
        gruposAdicionais,
        loading,
        error,
        selectedExtrasQuantities,
        selectedRadioComplementos,
        handleQuantityChange,
        handleRadioComplementoChange,
        gruposAdicionaisOpen,
        gruposComplementosOpen,
        toggleGrupoAdicional,
        toggleGrupoComplemento,
        complementosOpen,
        adicionaisOpen,
        setComplementosOpen,
        setAdicionaisOpen
    } = useProductData(id);

    const { quantity, incrementQuantity, decrementQuantity } = useQuantity();
    const { addToCart, showCartModal, setShowCartModal, lastAddedItem } = useCart();
    const { calculateTotalPrice, handleAddToCartWithValidation } = usePriceCalculator(
        product,
        gruposComplementos,
        gruposAdicionais,
        selectedExtrasQuantities,
        selectedRadioComplementos,
        quantity,
        addToCart,
        setShowCartModal
    );

    if (loading) {
        return <LoadingSpinner message="Carregando produto..." />;
    }

    if (error || !product) {
        return <ErrorDisplay error={error} />;
    }

    return (
         
        <div className="fixed pt-[50px] inset-0 bg-gradient-to-b from-gray-50 to-gray-100 overflow-y-auto">
            <HeaderPublic />
            <div className="max-w-2xl mx-auto pb-24 bg-white shadow-xl rounded-2xl overflow-hidden">
                <div className="p-4">
                    <ProductImage image={product.imagemPrincipalUrl} alt={product.nome} />
                    <ProductInfo
                        name={product.nome}
                        price={product.precoVenda}
                        description={product.descricao}
                    />

                    {gruposComplementos.length > 0 && (
                        <ComplementosSection
                            gruposComplementos={gruposComplementos}
                            isOpen={complementosOpen}
                            setIsOpen={setComplementosOpen}
                            gruposOpen={gruposComplementosOpen}
                            toggleGrupo={toggleGrupoComplemento}
                            selectedRadioComplementos={selectedRadioComplementos}
                            handleRadioChange={handleRadioComplementoChange}
                            selectedExtrasQuantities={selectedExtrasQuantities}
                            handleQuantityChange={handleQuantityChange}
                        />
                    )}

                    {gruposAdicionais.length > 0 && (
                        <AdicionaisSection
                            gruposAdicionais={gruposAdicionais}
                            isOpen={adicionaisOpen}
                            setIsOpen={setAdicionaisOpen}
                            gruposOpen={gruposAdicionaisOpen}
                            toggleGrupo={toggleGrupoAdicional}
                            selectedExtrasQuantities={selectedExtrasQuantities}
                            handleQuantityChange={handleQuantityChange}
                        />
                    )}

                    <QuantitySelector
                        quantity={quantity}
                        onIncrement={incrementQuantity}
                        onDecrement={decrementQuantity}
                    />
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-4 z-20">
                    <div className="max-w-2xl mx-auto flex justify-between items-center">
                        <TotalPrice total={calculateTotalPrice()} />
                        <AddToCartButton onClick={handleAddToCartWithValidation} />
                    </div>
                </div>
            </div>
            {showCartModal && <CartActionModal product={lastAddedItem} onClose={() => setShowCartModal(false)} />}
        </div>
    );
};

export default ProductDetails;