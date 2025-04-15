import React from "react";
import { Package, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

const OrderSummary = ({ cart, cartTotal, updateQuantity, removeFromCart, handleConfirmOrder }) => {
    const formatCurrency = (value) => {
        return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
    };
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6 sticky top-6 border border-gray-100">
            <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-bold flex items-center text-gray-800">
                    <ShoppingBag className="mr-2 text-blue-600" size={20} />
                    Resumo do Pedido
                </h2>
                <span className="bg-blue-100 text-blue-700 text-sm font-medium py-1 px-3 rounded-full">
                    {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </span>
            </div>

            {cart.length > 0 ? (
                <div className="max-h-80 overflow-y-auto pr-2 space-y-3 my-4">
                    {cart.map((item) => (
                        <div key={item.id} className="flex flex-col bg-gray-50 rounded-lg p-3 hover:shadow-sm transition-all">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-gray-800 flex-1 line-clamp-1">{item.nome}</h3>
                                <button
                                    onClick={() => removeFromCart(item.cartItemId)}
                                    className="ml-2 p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    title="Remover item"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex justify-between items-center mt-2">
                                <span className="text-gray-600 text-sm">
                                    {formatCurrency(item.precoVenda * item.quantity)}
                                </span>

                                <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <button
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                        className="p-1.5 hover:bg-gray-100 text-gray-700 transition-colors disabled:opacity-50"
                                        disabled={item.quantity <= 1}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-8 text-center font-medium text-gray-800">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                        className="p-1.5 hover:bg-gray-100 text-gray-700 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center text-gray-500">
                    <Package className="mx-auto mb-2 text-gray-400" size={32} />
                    <p>Seu carrinho está vazio</p>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                    <span>Entrega</span>
                    <span>Grátis</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(cartTotal)}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
