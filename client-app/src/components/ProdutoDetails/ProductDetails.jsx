import { useParams } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import ProductImage from './ProductImage';
import ProductInfo from './ProductInfo';
import QuantitySelector from './QuantitySelector';
import TotalPrice from './TotalPrice';
import AddToCartButton from './AddToCartButton';
import ErrorDisplay from './ErrorDisplay';
import ComplementosSection from './Complementos/ComplementosSection';
import ProductDetailsSkeleton from '../ui/skeleton/ProductDetailsSkeleton';
import AdicionaisSection from './Adicionais/AdicionaisSection';
import { useCart } from '../Context/CartContext';
import CartActionModal from '../Modals/CartActionModal';
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
        return <ProductDetailsSkeleton />;
    }
    if (error || !product) {
        return <ErrorDisplay error={error} />;
    }
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-30">
                <div className="max-w-2xl mx-auto flex items-center px-4 py-3">
                    <button
                        className="p-1 rounded-full hover:bg-gray-100"
                        onClick={() => window.history.back()}
                    >
                        <ChevronLeft size={24} className="text-gray-700" />
                    </button>
                    <h1 className="ml-4 font-medium text-gray-800 flex-1">Detalhes do Produto</h1>
                </div>
            </div>
            <div className="max-w-2xl mx-auto pt-16 pb-28">
                <div className="w-full h-64 relative overflow-hidden">
                    <ProductImage image={product.imagemPrincipalUrl} alt={product.nome} />
                </div>
                <div className="bg-white px-4 py-5">
                    <ProductInfo
                        name={product.nome}
                        price={product.precoVenda}
                        description={product.descricao}
                    />
                </div>
                <div className="h-2 bg-gray-50"></div>
                <div className="bg-white px-4 py-2">
                    {gruposComplementos.length > 0 && (
                        <div className="py-2">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Escolha seus complementos</h2>
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
                        </div>
                    )}
                    {gruposAdicionais.length > 0 && (
                        <div className="py-2">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Adicione extras</h2>
                            <AdicionaisSection
                                gruposAdicionais={gruposAdicionais}
                                isOpen={adicionaisOpen}
                                setIsOpen={setAdicionaisOpen}
                                gruposOpen={gruposAdicionaisOpen}
                                toggleGrupo={toggleGrupoAdicional}
                                selectedExtrasQuantities={selectedExtrasQuantities}
                                handleQuantityChange={handleQuantityChange}
                            />
                        </div>
                    )}
                    <div className="py-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">Quantidade</h2>
                        <QuantitySelector
                            quantity={quantity}
                            onIncrement={incrementQuantity}
                            onDecrement={decrementQuantity}
                        />
                    </div>
                </div>
                <div className="bg-white mt-2 px-4 py-4 flex items-center text-gray-500">
                    <Info size={18} className="mr-2" />
                    <span>Alguma observação? Adicione ao finalizar seu pedido.</span>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-20">
                <div className="max-w-2xl mx-auto flex justify-between items-center p-4">
                    <TotalPrice total={calculateTotalPrice()} />
                    <AddToCartButton onClick={handleAddToCartWithValidation} />
                </div>
            </div>

            {showCartModal && <CartActionModal product={lastAddedItem} onClose={() => setShowCartModal(false)} />}
        </div>
    );
};

export default ProductDetails;