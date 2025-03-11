'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface CartItem {
    id: number;
    design: {
      id: string;
      previewUrl: string;
      name: string;
      description: string;
    };
    quantity: number;
    price: number;
  }

interface CartContextType {
    cartItems: CartItem[];
    loading: boolean;
    refreshCart: () => Promise<void>;
    removeFromCart: (designId: string) => Promise<void>;
    updateQuantity: (designId: string, quantity: number) => Promise<void>;
  }

  const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/cart', {
        method: 'GET',
        headers,
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCartItems(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Удаляем товар из корзины
  const removeFromCart = async (designId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/cart/${designId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // await fetchCart(); // Обновляем корзину после удаления
        setCartItems((prevItems) => prevItems.filter((item) => item.design.id !== designId));
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      console.error(`Failed to remove item from cart: ${error}`);
      await fetchCart();
    }
  };

  const updateQuantity = async (designId: string, quantity: number) => {
    try {

        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.design.id === designId ? { ...item, quantity } : item
            )
        );
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cart/${designId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(quantity)
        });

        if (!response.ok) {
          throw new Error('Failed to update quantity on server');
        }
    } catch (error) {
      console.error(`Failed to update quantity: ${error}`);
      // Здесь можно добавить уведомление пользователю об ошибке, но не перезагружать всю корзину
      setCartItems((prevItems) =>
          prevItems.map((item) =>
              item.design.id === designId ? { ...item, quantity: item.quantity } : item
          )
      );
    }
};

  useEffect(() => {
    fetchCart(); // Загружаем корзину при монтировании
  }, [isAuthenticated]);

  const value = {
    cartItems,
    loading,
    refreshCart: fetchCart,
    removeFromCart,
    updateQuantity
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};