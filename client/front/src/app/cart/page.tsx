'use client'
import { toast } from 'sonner';

import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CartItem from './cartitem';
import ShareDesignForm from './ShareDesign/ShareDesignForm';
import styles from './styles.module.css';

interface CartItem {
    id: number;
    design: {
        id: string,
        previewUrl: string,
        name: string,
        description: string
    };
    quantity: number;
    price: number;
}

export default function Cart() {
    const { cartItems, loading, removeFromCart, updateQuantity, refreshCart } = useCart() as {
        cartItems: CartItem[];
        loading: boolean;
        removeFromCart: (designId: string) => Promise<void>;
        updateQuantity: (designId: string, quantity: number) => Promise<void>;
        refreshCart: () => Promise<void>;
    };
    const { isAuthenticated } = useAuth();
    const [shareFormDesignId, setShareFormDesignId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchCart = async () => {
            await refreshCart();
        };
        fetchCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return <div className={styles.loading}>Загрузка корзины...</div>;
    }

    const editDesign = (designId: string) => {
        router.push(`/design-constructor?designId=${designId}`);
    };

    const handleQuantityChange = async (designId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        await updateQuantity(designId, newQuantity);
    };

    const handleShare = (designId: string) => {
        if (!isAuthenticated) {
            toast.error("Пожалуйста, войдите в систему, чтобы поделиться дизайном.");
            return;
        }
        setShareFormDesignId(designId);
    };

    const handleCheckout = () => {
        router.push('/checkout');
    };

    return (
        <div className={styles.container}>
            {cartItems.length === 0 ? (
                <div className={styles.emptyCart}>Корзина пуста</div>
            ) : (
                <div className={styles.cartContent}>
                    {cartItems.map((item) => (
                        <CartItem
                            key={item.design.id}
                            item={item}
                            onEdit={editDesign}
                            onRemove={removeFromCart}
                            onQuantityChange={handleQuantityChange}
                            onShare={handleShare}
                        />
                    ))}
                    <div className={styles.total}>
                        Итого: {cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)} руб.
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={cartItems.length === 0}
                        className={styles.checkoutButton}
                    >
                        Оформить заказ
                    </button>
                </div>
            )}
            {shareFormDesignId && (
                <ShareDesignForm
                    designId={shareFormDesignId}
                    onClose={() => setShareFormDesignId(null)}
                    onSubmit={() => setShareFormDesignId(null)}
                />
            )}
        </div>
    );
}