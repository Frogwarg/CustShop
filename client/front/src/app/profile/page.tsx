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
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Загрузка данных пользователя
    const fetchUserData = async () => {
      try {
        const response = await authService.fetchWithRefresh("/api/profile");
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        const data = await response.json();
        setUserData(data);
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
        const response = await authService.fetchWithRefresh("/api/profile/designs");
        if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
        const data = await response.json();
        setDesigns(data);
      } catch (error) {
        console.error("Ошибка загрузки дизайнов:", error);
        if (error instanceof Error && error.message === "Токен истёк, требуется повторный вход") {
          toast.error("Сессия истекла, пожалуйста, войдите снова");
          router.push("/login");
        }
      }
    };

    fetchUserData();
    fetchDesigns();
  }, [isAuthenticated, router]);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await authService.fetchWithRefresh("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
      alert("Профиль обновлен!");
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
      if (error instanceof Error && error.message === "Токен истёк, требуется повторный вход") {
        router.push("/login");
      }
    }
  };

  if (!userData) return <div>Загрузка...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Профиль пользователя</h1>

      {/* Вкладки */}
      <div className="tabs mb-4">
        <button
          className={`px-4 py-2 ${activeTab === "info" ? "bg-blue-500 text-white" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          Личная информация
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "designs" ? "bg-blue-500 text-white" : ""}`}
          onClick={() => setActiveTab("designs")}
        >
          История дизайнов
        </button>
      </div>

      {/* Личная информация */}
      {activeTab === "info" && (
        <form onSubmit={handleUpdateProfile}>
          <div className="mb-4">
            <label>Имя:</label>
            <input
              type="text"
              value={userData.firstName || ""}
              onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
              className="border p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label>Фамилия:</label>
            <input
              type="text"
              value={userData.lastName || ""}
              onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
              className="border p-2 w-full"
            />
          </div>
          <div className="mb-4">
            <label>Email:</label>
            <input
              type="email"
              value={userData.email || ""}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              className="border p-2 w-full"
              disabled
            />
          </div>
          <div className="mb-4">
            <label>Телефон:</label>
            <input
              type="text"
              value={userData.phoneNumber || ""}
              onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
              className="border p-2 w-full"
            />
          </div>
          <button type="submit" className="bg-green-500 text-white px-4 py-2">
            Сохранить
          </button>
        </form>
      )}

      {/* История дизайнов */}
      {activeTab === "designs" && (
        <div>
          <h2 className="text-xl font-semibold mb-2">История дизайнов</h2>
          {designs.length === 0 ? (
            <p>Дизайнов пока нет.</p>
          ) : (
            <ul>
              {designs.map((design) => (
                <li key={design.id} className="border p-2 mb-2">
                  <p><strong>Название:</strong> {design.name}</p>
                  <p><strong>Описание:</strong> {design.description}</p>
                  <p><strong>Дата создания:</strong> {new Date(design.createdAt).toLocaleString()}</p>
                  <Image 
                    src={design.previewUrl} 
                    alt={design.name} 
                    width={100} 
                    height={100} 
                    className="object-cover"
                  />
                  <Link href={`/constructor?designId=${design.id}`}>Редактировать</Link>
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