'use client'
import { useCart } from '@/app/hooks/useCart';
import { toast } from 'sonner'
import Image from 'next/image';

interface CartItem {
    id: number;
    design: {
        imageUrl: string;
    };
    quantity: number;
    price: number;
}

export default function Cart() {
    const { cartItems, loading, refreshCart } = useCart() as {
        cartItems: CartItem[];
        loading: boolean;
        refreshCart: () => Promise<void>;
    };

    const removeFromCart = async (itemId: number) => {
        try {
            const response = await fetch(`/api/cart/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Обновляем состояние корзины после удаления
                await refreshCart();
            }
        } catch (error) {
            toast.error(`Не удалось удалить товар из корзины: ${error}`);
        }
    };

    if (loading) {
        return <div>Загрузка корзины...</div>;
    }

    return (
        <div>
            {cartItems.length === 0 ? (
                <div>Корзина пуста</div>
            ) : (
                <div>
                    {cartItems.map((item) => (
                        <div key={item.id}>
                            <Image src={item.design.imageUrl} alt="Дизайн" width={100} height={100} />
                            <div>Количество: {item.quantity}</div>
                            <div>Цена: {item.price} руб.</div>
                            <button onClick={() => removeFromCart(item.id)}>
                                Удалить
                            </button>
                        </div>
                    ))}
                    <div>
                        Итого: {cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)} руб.
                    </div>
                </div>
            )}
        </div>
    );
}