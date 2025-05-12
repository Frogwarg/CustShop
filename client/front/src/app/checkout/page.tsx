'use client';
import { useState, useEffect } from 'react';
import authService from '../services/authService';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import Image from 'next/image';
import styles from './Checkout.module.css';

interface ErrorResponse {
  message?: string;
}

interface CartItem {
  design: {
    id: string;
    name: string;
    previewUrl: string;
    productType: string;
    designHash: string;
  };
  quantity: number;
  price: number;
}

interface OrderResponse {
  id: string;
  totalAmount: number;
  discountAmount: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  orderComment: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  discount?: {
    code: string;
    amount: number;
    discountType: string;
  };
  orderItems: {
    designId: string;
    designName: string;
    previewUrl: string;
    quantity: number;
    unitPrice: number;
  }[];
  createdAt: string;
}

const CheckoutPage = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phoneNumber: '',
    deliveryMethod: 'Delivery',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    discountCode: '',
    orderComment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка корзины при монтировании компонента
  useEffect(() => {
    const fetchCart = async () => {
      try {
        // const response = await axios.get('/api/cart');
        const response = await authService.axiosWithRefresh<CartItem[]>('get', '/cart');
        console.log('Cart items:', response);
        setCartItems(response);
      } catch {
        setError('Не удалось загрузить корзину');
      }
    };
    fetchCart();
  }, []);

  // Обработка изменений в форме
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Отправка заказа
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        deliveryMethod: formData.deliveryMethod,
        orderComment: formData.orderComment,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        discountCode: formData.discountCode,
        userInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        },
      };

      const response = await axios.post<OrderResponse>('/api/order', orderData);
      router.push(`/order-confirmation?orderId=${response.data.id}`);
    } catch (err: unknown) {
        if (err instanceof AxiosError) {
            const axiosError = err as AxiosError<ErrorResponse>;
            setError(axiosError.response?.data?.message || 'Ошибка при создании заказа');
        } else {
            setError('Ошибка при создании заказа');
        }
    } finally {
      setLoading(false);
    }
  };

  // Расчет итоговой суммы
  const totalAmount = (cartItems || []).reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className={styles.container}>
      <h1>Оформление заказа</h1>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.checkoutGrid}>
        {/* Форма заказа */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>Контактные данные</h2>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="Имя"
            required
          />
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Фамилия"
            required
          />
          <input
            type="text"
            name="middleName"
            value={formData.middleName}
            onChange={handleInputChange}
            placeholder="Отчество"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Электронная почта"
            required
          />
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Телефон"
            required
          />

          <h2>Способ доставки</h2>
          <select
            name="deliveryMethod"
            value={formData.deliveryMethod}
            onChange={handleInputChange}
          >
            <option value="Delivery">Доставка</option>
            <option value="Pickup">Самовывоз</option>
          </select>

          {formData.deliveryMethod === 'Delivery' && (
            <>
              <h2>Адрес доставки</h2>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Улица"
                required
              />
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Город"
                required
              />
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="Область/регион"
                required
              />
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="Почтовый индекс"
                required
              />
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                placeholder="Страна"
                required
              />
            </>
          )}

          <h2>Дополнительно</h2>
          <input
            type="text"
            name="discountCode"
            value={formData.discountCode}
            onChange={handleInputChange}
            placeholder="Код скидки"
          />
          <textarea
            name="orderComment"
            value={formData.orderComment}
            onChange={handleInputChange}
            placeholder="Комментарий к заказу"
          />

          <button type="submit" disabled={loading || !(cartItems?.length)}>
            {loading ? 'Создание заказа...' : 'Оформить заказ'}
          </button>
        </form>

        {/* Список товаров */}
        <div className={styles.cartSummary}>
          <h2>Ваш заказ</h2>
          {cartItems?.length === 0 ? (
            <p>Корзина пуста</p>
          ) : (
            <>
              {cartItems?.map((item) => (
                <div key={item.design.id} className={styles.cartItem}>
                  <Image
                    src={item.design.previewUrl}
                    alt={item.design.name}
                    width={100}
                    height={100}
                    className={styles.preview}
                  />
                  <div className={styles.itemDetails}>
                    <h3>{item.design.name}</h3>
                    <p>Тип: {item.design.productType}</p>
                    <p>Количество: {item.quantity}</p>
                    <p>Цена за единицу: {item.price} ₽</p>
                    <p>Итого: {item.quantity * item.price} ₽</p>
                  </div>
                </div>
              ))}
              <div className={styles.total}>
                <p>Общая сумма: {totalAmount} ₽</p>
                {formData.discountCode && (
                  <p>Скидка: (будет рассчитана после оформления)</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;