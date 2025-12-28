'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cart, setCart] = useState({ items: [], restaurant: null });
    const [isOpen, setIsOpen] = useState(false);

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('fooddala_cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to localStorage
    useEffect(() => {
        localStorage.setItem('fooddala_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, restaurant) => {
        // If adding from different restaurant, clear cart first
        if (cart.restaurant && cart.restaurant._id !== restaurant._id) {
            if (!window.confirm('Adding items from a different restaurant will clear your cart. Continue?')) {
                return false;
            }
            setCart({ items: [], restaurant: null });
        }

        setCart(prev => {
            const existingIndex = prev.items.findIndex(
                i => i.menuItem._id === item.menuItem._id &&
                    JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
            );

            if (existingIndex > -1) {
                const newItems = [...prev.items];
                newItems[existingIndex].quantity += item.quantity;
                return { ...prev, items: newItems };
            }

            return {
                restaurant: restaurant,
                items: [...prev.items, item],
            };
        });

        return true;
    };

    const removeFromCart = (index) => {
        setCart(prev => {
            const newItems = prev.items.filter((_, i) => i !== index);
            if (newItems.length === 0) {
                return { items: [], restaurant: null };
            }
            return { ...prev, items: newItems };
        });
    };

    const updateQuantity = (index, quantity) => {
        if (quantity < 1) {
            removeFromCart(index);
            return;
        }

        setCart(prev => {
            const newItems = [...prev.items];
            newItems[index].quantity = quantity;
            return { ...prev, items: newItems };
        });
    };

    const clearCart = () => {
        setCart({ items: [], restaurant: null });
    };

    const getCartTotal = () => {
        return cart.items.reduce((total, item) => {
            const itemTotal = item.price * item.quantity;
            return total + itemTotal;
        }, 0);
    };

    const getCartCount = () => {
        return cart.items.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        cart,
        isOpen,
        setIsOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
    };

    return (
        <CartContext.Provider value={value}>
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
