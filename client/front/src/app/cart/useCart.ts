'use client'
import { useState, useEffect } from 'react';
import authService from '../services/authService';
import CartItem from './cartitem';

// Define or import the CartItem type
interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export const useCart = () => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCart = async () => {
        try {
            // const token = localStorage.getItem('token');
            // const response = await fetch('/api/cart', {
            //     method: 'GET',
            //     headers: {
            //         'Authorization': `Bearer ${token}`
            //     }
            // });
            const data = await authService.axiosWithRefresh<CartItem[]>('get', '/cart');
            //const data = await response.json();
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