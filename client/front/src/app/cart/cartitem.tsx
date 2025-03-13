// CartItem.tsx
import React from 'react';
import Image from 'next/image';

interface CartItemProps {
    item: {
        design: {
            id: string;
            previewUrl: string;
            name: string;
        };
        quantity: number;
        price: number;
    };
    //onEdit: (designId: string) => void;
    onRemove: (designId: string) => void;
    onQuantityChange: (designId: string, quantity: number) => void;
    onShare: (designId: string) => void;
}

const CartItem = React.memo(
    ({ item, onRemove, onQuantityChange, onShare }: CartItemProps) => {
        return (
            <div>
                <Image
                    src={item.design.previewUrl || '/placeholder.png'}
                    alt={`Дизайн ${item.design.name || ''}`}
                    width={100}
                    height={100}
                />
                <div>
                    
                    <span> Количество: 
                        <button
                            onClick={() => onQuantityChange(item.design.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                        >
                            -
                        </button>
                        {item.quantity}
                        <button onClick={() => onQuantityChange(item.design.id, item.quantity + 1)}>
                            +
                        </button>
                    </span>
                </div>
                <div>Цена: {item.price} руб.</div>
                <div>Сумма: {item.price * item.quantity} руб.</div>
                {/* <button onClick={() => onEdit(item.design.id)}>Редактировать дизайн</button> */}
                <button onClick={() => onRemove(item.design.id)}>Удалить товар</button>
                <button onClick={() => onShare(item.design.id)}>Поделиться товаром</button>
            </div>
        );
    },
    (prevProps, nextProps) =>
        prevProps.item.quantity === nextProps.item.quantity &&
        prevProps.item.design.id === nextProps.item.design.id // Сравниваем только нужные пропсы
);

CartItem.displayName = 'CartItem';

export default CartItem;