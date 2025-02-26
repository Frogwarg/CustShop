'use client'
import { useState, useEffect } from 'react';

export const useCart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCart = async () => {
        try {
            const response = await fetch('/api/cart');
            const data = await response.json();
            setCartItems(data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    return {
        cartItems,
        loading,
        refreshCart: fetchCart
    };
}; 