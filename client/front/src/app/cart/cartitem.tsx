import React from 'react';
import Image from 'next/image';
import styles from './styles.module.css';

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
    onEdit: (designId: string) => void;
    onRemove: (designId: string) => void;
    onQuantityChange: (designId: string, quantity: number) => void;
    onShare: (designId: string) => void;
}

const CartItem = React.memo(
    ({ item, onRemove, onEdit, onQuantityChange, onShare }: CartItemProps) => {
        return (
            <div className={styles.cartItem}>
                <Image
                    src={item.design.previewUrl || '/placeholder.png'}
                    alt={`Дизайн ${item.design.name || ''}`}
                    width={100}
                    height={100}
                    className={styles.itemImage}
                />
                <div className={styles.itemDetails}>
                    <h3 className={styles.itemName}>{item.design.name}</h3>
                    <div className={styles.quantityControl}>
                        <span>Количество:</span>
                        <button
                            onClick={() => onQuantityChange(item.design.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className={styles.quantityButton}
                        >
                            -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                            onClick={() => onQuantityChange(item.design.id, item.quantity + 1)}
                            className={styles.quantityButton}
                        >
                            +
                        </button>
                    </div>
                    <div className={styles.itemPrice}>Цена: {item.price} руб.</div>
                    <div className={styles.itemTotal}>Сумма: {item.price * item.quantity} руб.</div>
                    <div className={styles.itemActions}>
                        <button onClick={() => onEdit(item.design.id)} className={styles.actionButton}>
                            Редактировать дизайн
                        </button>
                        <button onClick={() => onShare(item.design.id)} className={styles.actionButton}>
                            Поделиться товаром
                        </button>
                        <button onClick={() => onRemove(item.design.id)} className={styles.actionButton}>
                            Удалить товар
                        </button>
                    </div>
                </div>
            </div>
        );
    },
    (prevProps, nextProps) =>
        prevProps.item.quantity === nextProps.item.quantity &&
        prevProps.item.design.id === nextProps.item.design.id
);

CartItem.displayName = 'CartItem';

export default CartItem;