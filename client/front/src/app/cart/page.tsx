'use client'
import { useCart } from '@/app/contexts/CartContext';
import Image from 'next/image';

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
    const { cartItems, loading, removeFromCart } = useCart() as {
        cartItems: CartItem[];
        loading: boolean;
        removeFromCart: (designId: string) => Promise<void>;
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
                        <div key={item.design.id || `item-${Math.random()}`}>
                            <Image 
                                src={item.design.previewUrl || '/placeholder.png'} 
                                alt={`Дизайн ${item.design.name || ''}`} 
                                width={100} 
                                height={100} 
                            />
                            <div>Количество: {item.quantity}</div>
                            <div>Цена: {item.price} руб.</div>
                            <button onClick={() => removeFromCart(item.design.id)}>
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