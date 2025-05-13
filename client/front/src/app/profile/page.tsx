"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import authService from "../services/authService";
import { toast } from "sonner";

interface UserData {
  firstName: string;
  lastName: string;
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
    createdAt: string;
    previewUrl: string;
  }>>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("info");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    label: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Загрузка данных пользователя
    const fetchUserData = async () => {
      try {
        const response = await authService.axiosWithRefresh<UserData>('get', "/profile");
        setUserData(response);
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
        if (error instanceof Error && error.message === "Токен истёк, требуется повторный вход") {
          toast.error("Сессия истекла, пожалуйста, войдите снова");
          router.push("/login");
        }
      }
    };

    // Загрузка истории дизайнов
    const fetchDesigns = async () => {
      try {
        const response = await authService.axiosWithRefresh<Array<{
            id: string;
            name: string;
            description: string;
            createdAt: string;
            previewUrl: string;
        }>>('get', "/profile/designs");
        setDesigns(response);
      } catch (error) {
        console.error("Ошибка загрузки дизайнов:", error);
        if (error instanceof Error && error.message === "Токен истёк, требуется повторный вход") {
          toast.error("Сессия истекла, пожалуйста, войдите снова");
          router.push("/login");
        }
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
        const response = await authService.axiosWithRefresh<Order[]>('get', "/orders");
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
  }, [isAuthenticated, router]);

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
      const savedAddress = await response;
      setAddresses([...addresses, savedAddress]);
      setNewAddress({ street: "", city: "", state: "", postalCode: "", country: "", label: "" });
      setShowAddressForm(false);
      toast.success("Адрес добавлен!");
    } catch (error) {
      console.error("Ошибка добавления адреса:", error);
      toast.error("Ошибка добавления адреса");
    }
  };

  const handleDeleteDesign = async (designId: string) => {
    try {
      await authService.axiosWithRefresh('delete', `/profile/designs/${designId}`);
      setDesigns(designs.filter((design) => design.id !== designId));
      toast.success("Дизайн удален!");
    } catch (error) {
      console.error("Ошибка удаления дизайна:", error);
      toast.error("Ошибка удаления дизайна");
    }
  };

  if (!userData) return <div>Загрузка...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Профиль пользователя</h1>

      {/* Вкладки */}
      <div className="tabs mb-4 flex space-x-2">
        <button
          className={`px-4 py-2 ${activeTab === "info" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("info")}
        >
          Мой профиль
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "addresses" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("addresses")}
        >
          Мои адреса
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "orders" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("orders")}
        >
          История заказов
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "designs" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("designs")}
        >
          История дизайнов
        </button>
      </div>

      {/* Мой профиль */}
      {activeTab === "info" && (
        <div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                    <label className="block">Email:</label>
                    <input
                    type="email"
                    value={userData.email || ""}
                    className="border p-2 w-full bg-gray-100"
                    disabled
                    />
                </div>
                <div>
                    <label className="block">Имя:</label>
                    <input
                    type="text"
                    value={userData.firstName || ""}
                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                    className="border p-2 w-full"
                    />
                </div>
                <div>
                    <label className="block">Фамилия:</label>
                    <input
                    type="text"
                    value={userData.lastName || ""}
                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                    className="border p-2 w-full"
                    />
                </div>
                <div>
                    <label className="block">Телефон:</label>
                    <input
                    type="text"
                    value={userData.phoneNumber || ""}
                    onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                    className="border p-2 w-full"
                    />
                </div>
                <div>
                    <label className="block">Био:</label>
                    <input
                    type="text"
                    value={userData.bio || ""}
                    onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                    className="border p-2 w-full"
                    />
                </div>
                <div>
                    <label className="block">Адреса доставки:</label>
                    <Link href="#" onClick={() => setActiveTab("addresses")} className="text-blue-500">
                    Перейти к адресам
                    </Link>
                </div>
                <button type="submit" className="bg-green-500 text-white px-4 py-2">
                    Сохранить
                </button>
            </form>
        </div>
      )}

      {/* Мои адреса */}
      {activeTab === "addresses" && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Мои адреса</h2>
          <button
            onClick={() => setShowAddressForm(!showAddressForm)}
            className="mb-4 bg-blue-500 text-white px-4 py-2"
          >
            {showAddressForm ? "Отмена" : "Добавить адрес"}
          </button>
          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="space-y-4 mb-4">
              <div>
                <label className="block">Улица:</label>
                <input
                  type="text"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block">Город:</label>
                <input
                  type="text"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block">Область/регион:</label>
                <input
                  type="text"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block">Почтовый индекс:</label>
                <input
                  type="text"
                  value={newAddress.postalCode}
                  onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block">Страна:</label>
                <input
                  type="text"
                  value={newAddress.country}
                  onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                  className="border p-2 w-full"
                  required
                />
              </div>
              <div>
                <label className="block">Метка (опционально):</label>
                <input
                  type="text"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="border p-2 w-full"
                />
              </div>
              <button type="submit" className="bg-green-500 text-white px-4 py-2">
                Сохранить адрес
              </button>
            </form>
          )}
          {addresses.length === 0 ? (
            <p>Адресов пока нет.</p>
          ) : (
            <ul className="space-y-2">
              {addresses.map((address) => (
                <li key={address.id} className="border p-2">
                  <p><strong>Метка:</strong> {address.label || "Без метки"}</p>
                  <p><strong>Адрес:</strong> {address.street}, {address.city}, {address.state}, {address.postalCode}, {address.country}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* История заказов */}
      {activeTab === "orders" && (
        <div>
          <h2 className="text-xl font-semibold mb-2">История заказов</h2>
          {orders.length === 0 ? (
            <p>Заказов пока нет.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => (
                <li key={order.id} className="border p-2">
                  <p><strong>Заказ №:</strong> {order.id}</p>
                  <p><strong>Дата:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  <p><strong>Сумма:</strong> {order.totalAmount} ₽</p>
                  <p><strong>Статус:</strong> {order.status}</p>
                  <p><strong>Оплата:</strong> {order.paymentStatus}</p>
                  <p><strong>Доставка:</strong> {order.deliveryMethod}</p>
                  <h3 className="font-semibold mt-2">Товары:</h3>
                  <ul className="ml-4">
                    {order.orderItems.map((item, index) => (
                      <li key={index}>
                        {item.designName} - {item.quantity} шт. x {item.unitPrice} ₽
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* История дизайнов */}
      {activeTab === "designs" && (
        <div>
          <h2 className="text-xl font-semibold mb-2">История дизайнов</h2>
          {designs.length === 0 ? (
            <p>Дизайнов пока нет.</p>
          ) : (
            <ul className="space-y-2">
              {designs.map((design) => (
                <li key={design.id} className="border p-2 flex items-start space-x-4">
                  <Image
                    src={design.previewUrl}
                    alt={design.name}
                    width={100}
                    height={100}
                    className="object-cover"
                  />
                  <div className="flex-1">
                    <p><strong>Название:</strong> {design.name}</p>
                    <p><strong>Описание:</strong> {design.description}</p>
                    <p><strong>Дата создания:</strong> {new Date(design.createdAt).toLocaleString()}</p>
                    <div className="mt-2 space-x-2">
                      <Link
                        href={`/constructor?designId=${design.id}`}
                        className="text-blue-500 hover:underline"
                      >
                        Редактировать
                      </Link>
                      <button
                        onClick={() => handleDeleteDesign(design.id)}
                        className="text-red-500 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button onClick={logout} className="mt-4 bg-red-500 text-white px-4 py-2">
        Выйти
      </button>
    </div>
  );
};

export default ProfilePage;