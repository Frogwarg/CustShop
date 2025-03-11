'use client'
import { useCart } from '@/app/contexts/CartContext';
//import { useRouter } from 'next/navigation';
import CartItem from './cartitem';

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
    const { cartItems, loading, removeFromCart, updateQuantity } = useCart() as {
        cartItems: CartItem[];
        loading: boolean;
        removeFromCart: (designId: string) => Promise<void>;
        updateQuantity: (designId: string, quantity: number) => Promise<void>;
    };
    //const router = useRouter();

    if (loading) {
        return <div>Загрузка корзины...</div>;
    }

    // const editDesign = (designId: string) => {
    //     router.push(`/constructor?designId=${designId}`);
    // };

    const handleQuantityChange = async (designId: string, newQuantity: number) => {
        if (newQuantity < 1) return; // Предотвращаем установку количества меньше 1
        await updateQuantity(designId, newQuantity);
    };

    return (
        <div>
            {cartItems.length === 0 ? (
                <div>Корзина пуста</div>
            ) : (
                <div>
                    {cartItems.map((item) => (
                        <CartItem
                            key={item.design.id}
                            item={item}
                            //onEdit={editDesign}
                            onRemove={removeFromCart}
                            onQuantityChange={handleQuantityChange}
                        />
                    ))}
                    <div>
                        Итого: {cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)} руб.
                    </div>
                </div>
            )}
        </div>
    );
}