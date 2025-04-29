import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../Context/StoreContext';

const CartActionModal = ({ onClose, lastAddedItem }) => {
    const navigate = useNavigate();
    const { currentStore } = useStore();
    const formatPrice = (price) => {
        return typeof price === 'number' ? price.toFixed(2) : '0.00';
    };
    const calculateItemTotal = (item) => {
        const basePrice = item.precoVenda * item.quantity;
        const extrasTotal = item.selectedExtras.reduce((sum, extra) => {
            const extraPrice = extra.preco || extra.precoAdicional || extra.precoBase || 0;
            return sum + (extraPrice * extra.quantity);
        }, 0);
        return basePrice + extrasTotal;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-green-100 rounded-full p-3">
                            <ShoppingBag className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-center mb-2">
                        Item adicionado ao carrinho!
                    </h3>
                    {lastAddedItem && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="font-medium">{lastAddedItem.nome}</p>
                            <p className="text-sm text-gray-600">
                                Quantidade: {lastAddedItem.quantity} x R$ {formatPrice(lastAddedItem.precoVenda)}
                            </p>
                            {lastAddedItem.selectedExtras?.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-600">Extras:</p>
                                    <ul className="text-sm text-gray-600">
                                        {lastAddedItem.selectedExtras.map(extra => (
                                            <li key={extra.id} className="flex justify-between">
                                                <span>• {extra.nome} ({extra.quantity}x)</span>
                                                <span>R$ {formatPrice(extra.price * extra.quantity)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="font-medium flex justify-between">
                                    <span>Total:</span>
                                    <span>R$ {formatPrice(calculateItemTotal(lastAddedItem))}</span>
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                navigate('/checkout');
                                onClose();
                            }}
                            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 transition-colors"
                        >
                            <span>Finalizar Compra</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => window.location.href = `/loja/${currentStore}`}
                            className="w-full py-3 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Continuar Comprando
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartActionModal;