'use client';
import { useState, useEffect } from 'react';
import authService from '../services/authService';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import AddAddressModal from '../profile/AddAddressModal';
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

interface UserInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
}

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Схема валидации с помощью Zod
const schema = z.object({
  firstName: z.string().min(1, 'Имя обязательно').regex(/^[a-zA-Zа-яА-Я]*$/, 'Только буквы'),
  lastName: z.string().min(1, 'Фамилия обязательна').regex(/^[a-zA-Zа-яА-Я]*$/, 'Только буквы'),
  middleName: z.string().regex(/^[a-zA-Zа-яА-Я]*$/, 'Только буквы').optional().or(z.literal('')),
  email: z.string().email('Неверный формат email'),
  phoneNumber: z.string().regex(/^\d+$/, 'Только цифры').min(10, 'Минимум 10 цифр'),
  deliveryMethod: z.enum(['Delivery', 'Pickup']),
  street: z.string().optional().or(z.literal('')),
  city: z.string().regex(/^[a-zA-Zа-яА-Я\s-]*$/, 'Только буквы').optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  postalCode: z.string().regex(/^\d*$/, 'Только цифры').optional().or(z.literal('')),
  country: z.string().regex(/^[a-zA-Zа-яА-Я\s-]*$/, 'Только буквы').optional().or(z.literal('')),
  discountCode: z.string().optional(),
  orderComment: z.string().optional(),
}).refine(
  (data) => {
    if (data.deliveryMethod === 'Delivery') {
      return (
        data.street &&
        data.city &&
        data.state &&
        data.postalCode &&
        data.country
      );
    }
    return true;
  },
  {
    message: 'Все поля адреса обязательны для доставки',
    path: ['street'], // Указываем поле, где показывать ошибку
  }
);

type FormData = z.infer<typeof schema>;

const CheckoutPage = () => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  
// Настройка формы с react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryMethod: 'Delivery',
    },
  });

  const deliveryMethod = watch('deliveryMethod');

  // Загрузка корзины при монтировании компонента
  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
      try {
        const isAuth = await authService.validateToken();
        setIsAuthenticated(isAuth);
        if (isAuth) {
          const user = await authService.getCurrentUser();
          if (user) {
            setUserInfo(user);
          }
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    const fetchCart = async () => {
      try {
        const response = await authService.axiosWithRefresh<CartItem[]>('get', '/cart');
        setCartItems(response);
      } catch {
        setError('Не удалось загрузить корзину');
      }
    };
    checkAuthAndFetchUser();
    fetchCart();
  }, []);

  // Загрузка сохраненных адресов для авторизованного пользователя
  useEffect(() => {
    if (isAuthenticated && deliveryMethod === 'Delivery') {
      const fetchSavedAddresses = async () => {
        try {
          const response = await authService.axiosWithRefresh<SavedAddress[]>('get', '/profile/addresses');
          setSavedAddresses(response);
        } catch {
          setError('Не удалось загрузить сохраненные адреса');
        }
      };
      fetchSavedAddresses();
    }
  }, [isAuthenticated, deliveryMethod]);

  // Заполнение формы данными пользователя
  const fillWithUserData = () => {
    if (userInfo) {
      setValue('firstName', userInfo.firstName);
      setValue('lastName', userInfo.lastName);
      setValue('middleName', userInfo.middleName || '');
      setValue('email', userInfo.email);
      setValue('phoneNumber', userInfo.phoneNumber);
    }
  };

  // Выбор сохраненного адреса
  const selectSavedAddress = (address: SavedAddress) => {
    setValue('street', address.street);
    setValue('city', address.city);
    setValue('state', address.state);
    setValue('postalCode', address.postalCode);
    setValue('country', address.country);
    setIsAddressModalOpen(false);
  };

  // Обработка изменений в форме
  // const handleInputChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  // ) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };

  // Отправка заказа
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        deliveryMethod: data.deliveryMethod,
        orderComment: data.orderComment || '',
        address: {
          street: data.street || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          country: data.country || '',
        },
        discountCode: data.discountCode || '',
        userInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName || '',
          email: data.email,
          phoneNumber: data.phoneNumber,
        },
      };

      const response = await authService.axiosWithRefresh<OrderResponse>('post', '/order', orderData);
      router.push(`/order-confirmation?orderId=${response.id}`);
    } catch (err: unknown) {
        if (err instanceof AxiosError) {
            const axiosError = err as AxiosError<ErrorResponse>;
            console.error("Ошибка:", axiosError);
            setError(axiosError.response?.data?.message || 'Ошибка Axios при создании заказа');
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
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <h2>Контактные данные</h2>

          {isAuthenticated && (
            <button
              type="button"
              onClick={fillWithUserData}
              className={styles.fillButton}
            >
              Заполнить данными аккаунта
            </button>
          )}

          <div>
            <input
              {...register('firstName')}
              placeholder="Имя"
              className={errors.firstName ? styles.inputError : ''}
            />
            {errors.firstName && <p className={styles.fieldError}>{errors.firstName.message}</p>}
          </div>
          <div>
            <input
              {...register('lastName')}
              placeholder="Фамилия"
              className={errors.lastName ? styles.inputError : ''}
            />
            {errors.lastName && <p className={styles.fieldError}>{errors.lastName.message}</p>}
          </div>
          <div>
            <input
              {...register('middleName')}
              placeholder="Отчество"
              className={errors.middleName ? styles.inputError : ''}
            />
            {errors.middleName && <p className={styles.fieldError}>{errors.middleName.message}</p>}
          </div>
          <div>
            <input
              {...register('email')}
              placeholder="Электронная почта"
              className={errors.email ? styles.inputError : ''}
            />
            {errors.email && <p className={styles.fieldError}>{errors.email.message}</p>}
          </div>
          <div>
            <input
              {...register('phoneNumber')}
              placeholder="Телефон"
              className={errors.phoneNumber ? styles.inputError : ''}
            />
            {errors.phoneNumber && <p className={styles.fieldError}>{errors.phoneNumber.message}</p>}
          </div>

          <h2>Способ доставки</h2>
          <select {...register('deliveryMethod')}>
            <option value="Delivery">Доставка</option>
            <option value="Pickup">Самовывоз</option>
          </select>

          {deliveryMethod === 'Delivery' && (
            <>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className={styles.addressButton}
                >
                  Сохранённые адреса
                </button>
              )}
              <h2>Адрес доставки</h2>
              <div>
                <input
                  {...register('street')}
                  placeholder="Улица"
                  className={errors.street ? styles.inputError : ''}
                />
                {errors.street && <p className={styles.fieldError}>{errors.street.message}</p>}
              </div>
              <div>
                <input
                  {...register('city')}
                  placeholder="Город"
                  className={errors.city ? styles.inputError : ''}
                />
                {errors.city && <p className={styles.fieldError}>{errors.city.message}</p>}
              </div>
              <div>
                <input
                  {...register('state')}
                  placeholder="Область/регион"
                  className={errors.state ? styles.inputError : ''}
                />
                {errors.state && <p className={styles.fieldError}>{errors.state.message}</p>}
              </div>
              <div>
                <input
                  {...register('postalCode')}
                  placeholder="Почтовый индекс"
                  className={errors.postalCode ? styles.inputError : ''}
                />
                {errors.postalCode && <p className={styles.fieldError}>{errors.postalCode.message}</p>}
              </div>
              <div>
                <input
                  {...register('country')}
                  placeholder="Страна"
                  className={errors.country ? styles.inputError : ''}
                />
                {errors.country && <p className={styles.fieldError}>{errors.country.message}</p>}
              </div>
            </>
          )}

          <h2>Дополнительно</h2>
          <div>
            <input
              {...register('discountCode')}
              placeholder="Код скидки"
              className={errors.discountCode ? styles.inputError : ''}
            />
            {errors.discountCode && <p className={styles.fieldError}>{errors.discountCode.message}</p>}
          </div>
          <div>
            <textarea
              {...register('orderComment')}
              placeholder="Комментарий к заказу"
            />
          </div>

          <button type="submit" disabled={loading || !(cartItems?.length)} className={styles.submitButton}>
            {loading ? 'Создание заказа...' : 'Оформить заказ'}
          </button>
        </form>

        {/* Модальное окно для выбора адреса */}
        {isAddressModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Выберите сохранённый адрес</h2>
              {savedAddresses.length === 0 ? (
                <p>Нет сохранённых адресов</p>
              ) : (
                <ul className={styles.addressList}>
                  {savedAddresses.map((address) => (
                    <li
                      key={address.id}
                      onClick={() => selectSavedAddress(address)}
                      className={styles.addressItem}
                    >
                      <strong>{address.label}</strong>
                      <p>{address.street}, {address.city}, {address.state}, {address.postalCode}, {address.country}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.modalButtons}>
                <button
                  onClick={() => setIsAddAddressModalOpen(true)}
                  className={`${styles.addAddressButton} ${styles.blue}`}
                >
                  Добавить новый
                </button>
                <button
                  onClick={() => setIsAddressModalOpen(false)}
                  className={`${styles.closeModalButton} ${styles.gray}`}
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно для добавления нового адреса */}
        <AddAddressModal
          isOpen={isAddAddressModalOpen}
          onClose={() => setIsAddAddressModalOpen(false)}
          onAddressAdded={(address) => {
            // Ensure label is always a string
            const normalizedAddress: SavedAddress = {
              ...address,
              label: address.label ?? 'Без метки',
            };
            setSavedAddresses([...savedAddresses, normalizedAddress]);
            setValue('street', normalizedAddress.street);
            setValue('city', normalizedAddress.city);
            setValue('state', normalizedAddress.state);
            setValue('postalCode', normalizedAddress.postalCode);
            setValue('country', normalizedAddress.country);
            setIsAddAddressModalOpen(false);
            setIsAddressModalOpen(false);
            toast.success('Адрес добавлен и выбран!');
          }}
        />

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
                {watch('discountCode') && (
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