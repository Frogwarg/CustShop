'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from '../checkout/Checkout.module.css';
import authService from '../services/authService';

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Интерфейс для элемента заказа
interface OrderItem {
  designId: string;
  previewUrl: string;
  designName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  orderItems: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  deliveryMethod: 'Delivery' | 'Pickup'; // Предполагаем два возможных значения
  address?: Address; // Опционально, так как адрес есть только при deliveryMethod === 'Delivery'
  orderComment?: string; // Опционально, так как может отсутствовать
}

const OrderConfirmationPage = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          // const response = await axios.get(`/api/order/${orderId}`);
          const response = await authService.axiosWithRefresh<Order>('get', `/order/${orderId}`);
          setOrder(response);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message || 'Не удалось загрузить заказ');
          } else {
            setError('Не удалось загрузить заказ');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId]);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!order) return <p>Заказ не найден</p>;

  return (
    <div className={styles.container}>
      <h1>Заказ #{order.id} успешно оформлен</h1>
      <div className={styles.cartSummary}>
        <h2>Детали заказа</h2>
        {order.orderItems.map((item: OrderItem) => (
          <div key={item.designId} className={styles.cartItem}>
            <Image
              src={item.previewUrl}
              alt={item.designName}
              width={100}
              height={100}
              className={styles.preview}
            />
            <div className={styles.itemDetails}>
              <h3>{item.designName}</h3>
              <p>Количество: {item.quantity}</p>
              <p>Цена за единицу: {item.unitPrice} ₽</p>
              <p>Итого: {item.quantity * item.unitPrice} ₽</p>
            </div>
          </div>
        ))}
        <div className={styles.total}>
          <p>Общая сумма: {order.totalAmount} ₽</p>
          {order.discountAmount > 0 && (
            <p>Скидка: {order.discountAmount} ₽</p>
          )}
        </div>
        <h2>Информация о доставке</h2>
        <p>Способ: {order.deliveryMethod === 'Delivery' ? 'Доставка' : 'Самовывоз'}</p>
        {order.deliveryMethod === 'Delivery' && (
          <>
            <p>Адрес: {order.address ? `${order.address.street}, ${order.address.city}, ${order.address.state}, ${order.address.postalCode}, ${order.address.country}` : 'Адрес не указан'}</p>
          </>
        )}
        <p>Комментарий: {order.orderComment || 'Отсутствует'}</p>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;