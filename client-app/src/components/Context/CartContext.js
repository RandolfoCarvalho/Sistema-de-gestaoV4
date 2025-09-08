import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [cartTotal, setCartTotal] = useState(0);
    const [showCartModal, setShowCartModal] = useState(false);
    const [lastAddedItem, setLastAddedItem] = useState(null);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
        calculateTotal();
    }, [cart]);

    const calculateTotal = () => {
        const total = cart.reduce((sum, item) => {
            const basePrice = item.precoVenda * item.quantity;
            const extrasTotal = item.selectedExtras.reduce((extraSum, extra) => {
                const extraPrice = extra.preco || extra.precoAdicional || extra.precoBase || 0;
                return extraSum + (extraPrice * extra.quantity * item.quantity);
            }, 0);
            return sum + basePrice + extrasTotal;
        }, 0);

        setCartTotal(total);
    };

    const areExtrasEqual = (extras1, extras2) => {
        if (extras1.length !== extras2.length) return false;

        const normalizeExtra = extra => ({
            id: extra.id,
            nome: extra.nome,
            quantity: extra.quantity,
            price: extra.preco || extra.precoAdicional || extra.precoBase || 0,
            type: extra.preco ? 'complemento' : 'adicional'
        });

        const sortedExtras1 = [...extras1].map(normalizeExtra).sort((a, b) => a.id - b.id);
        const sortedExtras2 = [...extras2].map(normalizeExtra).sort((a, b) => a.id - b.id);

        return sortedExtras1.every((extra, index) => {
            const extra2 = sortedExtras2[index];
            return extra.id === extra2.id &&
                extra.nome === extra2.nome &&
                extra.quantity === extra2.quantity &&
                extra.price === extra2.price &&
                extra.type === extra2.type;
        });
    };

    const addToCart = (product, quantity, selectedExtras) => {
        const normalizedExtras = selectedExtras.map(extra => ({
            ...extra,
            quantity: extra.quantity || 1,
            price: extra.preco || extra.precoAdicional || extra.precoBase || 0,
            type: extra.preco ? 'complemento' : 'adicional'
        }));

        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(item =>
                item.id === product.id && areExtrasEqual(item.selectedExtras, normalizedExtras)
            );

            if (existingItemIndex >= 0) {
                const updatedCart = [...prevCart];
                updatedCart[existingItemIndex].quantity += quantity;
                return updatedCart;
            }
            const newItem = {
                ...product,
                quantity,
                selectedExtras: normalizedExtras,
                cartItemId: Date.now()
            };

            setLastAddedItem(newItem);
            return [...prevCart, newItem];
        });

        setShowCartModal(true);
    };

    const removeFromCart = (cartItemId) => {
        setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId, newQuantity) => {
        if (newQuantity < 1) return;

        setCart(prevCart => {
            const updatedCart = prevCart.map(item => {
                if (item.cartItemId === cartItemId) {
                    return {
                        ...item,
                        quantity: newQuantity,
                    };
                }
                return item;
            });
            return updatedCart;
        });
    };
    const clearCart = () => {
        setCart([]);
        setLastAddedItem(null);
    };

    return (
        <CartContext.Provider value={{
            cart,
            cartTotal,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            showCartModal,
            setShowCartModal,
            lastAddedItem
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}