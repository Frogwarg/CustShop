"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import authService from "../services/authService";
import { toast } from "sonner";
import styles from "./Profile.module.css";
interface UserData {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber: string;
  avatarUrl?: string;
  bio?: string;
}

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  label?: string;
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  createdAt: string;
  orderItems: {
    designName: string;
    quantity: number;
    unitPrice: number;
    previewUrl: string;
  }[];
}

const ProfilePage = () => {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [designs, setDesigns] = useState<Array<{
    id: string;
    name: string;
    description: string;
    previewUrl: string;
    productType: string;
    createdAt: string;
  }>>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    label: "",
  });

    const handleLogout = async () =>{
      await logout();
      router.push('/');
    }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // Загрузка данных пользователя
    const fetchUserData = async () => {
      try {
        const response = await authService.axiosWithRefresh<UserData>('get', "/profile");
        console.log("Профиль пользователя:", response);
        setUserData(response);
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
      }
    };

    // Загрузка истории дизайнов
    const fetchDesigns = async () => {
      try {
        const response = await authService.axiosWithRefresh<Array<{
            id: string;
            name: string;
            description: string;
            previewUrl: string;
            productType: string;
            createdAt: string;
        }>>('get', "/profile/designs");
        setDesigns(response);
      } catch (error) {
        console.error("Ошибка загрузки дизайнов:", error);
      }
    };

    // Загрузка адресов
    const fetchAddresses = async () => {
      try {
        const response = await authService.axiosWithRefresh<Address[]>('get', "/profile/addresses");
        setAddresses(response);
      } catch (error) {
        console.error("Ошибка загрузки адресов:", error);
        toast.error("Ошибка загрузки адресов");
      }
    };

    // Загрузка истории заказов
    const fetchOrders = async () => {
      try {
        const response = await authService.axiosWithRefresh<Order[]>('get', "/profile/orders");
        setOrders(response);
      } catch (error) {
        console.error("Ошибка загрузки заказов:", error);
        toast.error("Ошибка загрузки заказов");
      }
    };

    fetchUserData();
    fetchDesigns();
    fetchAddresses();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
        await authService.axiosWithRefresh<UserData>('put', "/profile", JSON.stringify(userData));
        toast.success("Профиль обновлен!");
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
      if (error instanceof Error && error.message === "Токен истёк, требуется повторный вход") {
        router.push("/login");
      } else {
        toast.error("Ошибка обновления профиля");
      }
    }
  };

  const handleAddAddress = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await authService.axiosWithRefresh<Address>('post', "/profile/addresses", JSON.stringify(newAddress));
      setAddresses([...addresses, response]);
      setNewAddress({ street: "", city: "", state: "", postalCode: "", country: "", label: "" });
      setShowAddressModal(false);
      toast.success("Адрес добавлен!");
    } catch (error) {
      console.error("Ошибка добавления адреса:", error);
      toast.error("Ошибка добавления адреса");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await authService.axiosWithRefresh('delete', `/profile/addresses/${addressId}`);
      setAddresses(addresses.filter((address) => address.id !== addressId));
      toast.success("Адрес удален!");
    } catch (error) {
      console.error("Ошибка удаления адреса:", error);
      toast.error("Ошибка удаления адреса");
    }
  };

  // const handleDeleteDesign = async (designId: string) => {
  //   try {
  //     await authService.axiosWithRefresh('delete', `/profile/designs/${designId}`);
  //     setDesigns(designs.filter((design) => design.id !== designId));
  //     toast.success("Дизайн удален!");
  //   } catch (error) {
  //     console.error("Ошибка удаления дизайна:", error);
  //     toast.error("Ошибка удаления дизайна");
  //   }
  // };

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (!userData) return <div className={styles.container}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Профиль пользователя</h1>

      {/* Вкладки */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === "info" ? styles.active : ""}`}
          onClick={() => setActiveTab("info")}
        >
          Мой профиль
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "addresses" ? styles.active : ""}`}
          onClick={() => setActiveTab("addresses")}
        >
          Мои адреса
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "orders" ? styles.active : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          История заказов
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "designs" ? styles.active : ""}`}
          onClick={() => setActiveTab("designs")}
        >
          История дизайнов
        </button>
      </div>

      {/* Мой профиль */}
      {activeTab === "info" && (
        <div>
          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email:</label>
              <input
                type="email"
                value={userData.email || ""}
                className={styles.input}
                disabled
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Имя:</label>
              <input
                type="text"
                value={userData.firstName || ""}
                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Фамилия:</label>
              <input
                type="text"
                value={userData.lastName || ""}
                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Отчество:</label>
              <input
                type="text"
                value={userData.middleName || ""}
                onChange={(e) => setUserData({ ...userData, middleName: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Телефон:</label>
              <input
                type="text"
                value={userData.phoneNumber || ""}
                onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Биография:</label>
              <input
                type="text"
                value={userData.bio || ""}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Адреса доставки:</label>
              <Link href="#" onClick={() => setActiveTab("addresses")} className={styles.link}>
                Перейти к адресам
              </Link>
            </div>
            <button type="submit" className={`${styles.button} ${styles.green}`}>
              Сохранить
            </button>
          </form>
        </div>
      )}

      {/* Мои адреса */}
      {activeTab === "addresses" && (
        <div>
          <h2 className={styles.title}>Мои адреса</h2>
          {addresses.length === 0 ? (
            <p className={styles.noData}>Адресов пока нет.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Метка</th>
                  <th>Улица</th>
                  <th>Город</th>
                  <th>Область</th>
                  <th>Почтовый индекс</th>
                  <th>Страна</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((address) => (
                  <tr key={address.id}>
                    <td>{address.label || "Без метки"}</td>
                    <td>{address.street}</td>
                    <td>{address.city}</td>
                    <td>{address.state}</td>
                    <td>{address.postalCode}</td>
                    <td>{address.country}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className={styles.tableActionButton}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <button
            onClick={() => setShowAddressModal(true)}
            className={`${styles.button} ${styles.blue}`}
          >
            Добавить адрес
          </button>

          {/* Модальное окно для добавления адреса */}
          {showAddressModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <h3 className={styles.modalTitle}>Добавить новый адрес</h3>
                <form onSubmit={handleAddAddress} className={styles.modalForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Улица:</label>
                    <input
                      type="text"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Город:</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Область/регион:</label>
                    <input
                      type="text"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Почтовый индекс:</label>
                    <input
                      type="text"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Страна:</label>
                    <input
                      type="text"
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Метка (опционально):</label>
                    <input
                      type="text"
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.modalButtons}>
                    <button
                      type="submit"
                      className={`${styles.button} ${styles.green}`}
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(false)}
                      className={`${styles.button} ${styles.gray}`}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* История заказов */}
      {activeTab === "orders" && (
        <div>
          <h2 className={styles.title}>История заказов</h2>
          {orders.length === 0 ? (
            <p className={styles.noData}>Заказов пока нет.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Заказ №</th>
                  <th>Дата</th>
                  <th>Сумма</th>
                  <th>Статус</th>
                  <th>Оплата</th>
                  <th>Доставка</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr
                      className={styles.orderRow}
                      onClick={() => toggleOrderDetails(order.id)}
                    >
                      <td>{order.id}</td>
                      <td>{new Date(order.createdAt).toLocaleString()}</td>
                      <td>{order.totalAmount} ₽</td>
                      <td>{order.status}</td>
                      <td>{order.paymentStatus}</td>
                      <td>{order.deliveryMethod}</td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr>
                        <td colSpan={6} className={styles.orderDetails}>
                          <h3 className={styles.label}>Товары:</h3>
                          <div className={styles.form}>
                            {order.orderItems.map((item, index) => (
                              <div key={index} className={styles.orderItem}>
                                <Image
                                  src={item.previewUrl}
                                  alt={item.designName}
                                  width={80}
                                  height={80}
                                  className={styles.orderItemImage}
                                />
                                <div>
                                  <p><strong>Дизайн:</strong> {item.designName}</p>
                                  <p><strong>Количество:</strong> {item.quantity} шт.</p>
                                  <p><strong>Цена за единицу:</strong> {item.unitPrice} ₽</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* История дизайнов */}
      {activeTab === "designs" && (
        <div>
          <h2 className={styles.title}>История дизайнов</h2>
          {designs.length === 0 ? (
            <p className={styles.noData}>Дизайнов пока нет.</p>
          ) : (
            <ul className={styles.form}>
              {designs.map((design) => (
                <li key={design.id} className={styles.table} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <Image
                    src={design.previewUrl}
                    alt={design.name}
                    width={100}
                    height={100}
                    style={{ objectFit: 'contain' }}
                  />
                  <div style={{ flex: 1 }}>
                    <p><strong>Название:</strong> {design.name}</p>
                    <p><strong>Описание:</strong> {design.description}</p>
                    <p><strong>Тип продукта:</strong> {design.productType}</p>
                    <p><strong>Дата создания:</strong> {new Date(design.createdAt).toLocaleString('ru-RU')}</p>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <Link
                        href={`/design-constructor?designId=${design.id}`}
                        className={styles.link}
                      >
                        Редактировать
                      </Link>
                      {/* <button
                        onClick={() => handleDeleteDesign(design.id)}
                        className={styles.tableActionButton}
                      >
                        Удалить
                      </button> */}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button onClick={handleLogout} className={`${styles.button} ${styles.red}`}>
        Выйти
      </button>
    </div>
  );
};

export default ProfilePage;