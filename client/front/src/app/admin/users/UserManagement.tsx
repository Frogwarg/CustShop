"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import authService from "../../services/authService";
import useDebounce from "../../utils/useDebounce";
import styles from "./UserManagement.module.css";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  bio?:string;
  phoneNumber: string;
  roles: string[];
}

interface UserResponse {
  users: User[];
  totalCount: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, roleFilter, page]);

  const fetchUsers = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(roleFilter && { role: roleFilter }),
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const response = await authService.axiosWithRefresh<UserResponse>("get", `/admin/users?${queryParams.toString()}`);
      setUsers(response?.users || []);
      const totalCount = Math.ceil((response?.totalCount || 0) / pageSize);
      setTotalPages(totalCount != 0 ? totalCount : 1);
    } catch (error) {
      toast.error("Ошибка загрузки пользователей");
      console.error(error);
    }
  };

  const updateUser = async () => {
    if (!editUser) return;
    try {
      await authService.axiosWithRefresh("put", `/admin/users/${editUser.id}`, {
        firstName: editUser.firstName,
        lastName: editUser.lastName,
        middleName: editUser.middleName || "",
        bio: editUser.bio || "",
        phoneNumber: editUser.phoneNumber,
        roles: editUser.roles,
      });
      setEditUser(null);
      fetchUsers();
      toast.success("Пользователь обновлён");
    } catch (error) {
      toast.error("Ошибка обновления пользователя");
      console.error(error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await authService.axiosWithRefresh("delete", `/admin/users/${id}`);
      fetchUsers();
      toast.success("Пользователь удалён");
    } catch (error) {
      toast.error("Ошибка удаления пользователя");
      console.error(error);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1)
      setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages)
      setPage(page + 1);
    };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Управление пользователями</h2>
      <div className={styles.form}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по ID, ФИО, телефону, email"
          className={styles.input}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={styles.input}
        >
          <option value="">Все роли</option>
          <option value="User">Пользователь</option>
          <option value="Moderator">Модератор</option>
          <option value="Admin">Админ</option>
        </select>
      </div>
      {editUser && (
        <div className={styles.form}>
          <input
            type="text"
            value={editUser.firstName}
            onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
            placeholder="Имя"
            className={styles.input}
          />
          <input
            type="text"
            value={editUser.lastName}
            onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
            placeholder="Фамилия"
            className={styles.input}
          />
          <input 
            type="text"
            value={editUser.middleName || ""}
            onChange={(e)=> setEditUser({ ...editUser, middleName: e.target.value })}
            placeholder="Отчество"
            className={styles.input}
          />
          <input
            type="text"
            value={editUser.phoneNumber}
            onChange={(e) => setEditUser({ ...editUser, phoneNumber: e.target.value })}
            placeholder="Телефон"
            className={styles.input}
          />
          <select
            multiple
            value={editUser.roles}
            onChange={(e) =>
              setEditUser({
                ...editUser,
                roles: Array.from(e.target.selectedOptions, (option) => option.value),
              })
            }
            className={styles.input}
          >
            <option value="User">Пользователь</option>
            <option value="Moderator">Модератор</option>
            <option value="Admin">Админ</option>
          </select>
          <button onClick={updateUser} className={styles.saveButton}>
            Сохранить
          </button>
          <button onClick={() => setEditUser(null)} className={styles.cancelButton}>
            Отмена
          </button>
        </div>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>ID</th>
            <th className={styles.th}>ФИО</th>
            <th className={styles.th}>Телефон</th>
            <th className={styles.th}>Биография</th>
            <th className={styles.th}>Email</th>
            <th className={styles.th}>Роли</th>
            <th className={styles.th}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className={styles.tr}>
              <td className={styles.td}>{user.id}</td>
              <td className={styles.td}>{`${user.firstName} ${user.lastName} ${user.middleName || ""}`}</td>
              <td className={styles.td}>{user.phoneNumber}</td>
              <td className={styles.td}>{user.bio || ""}</td>
              <td className={styles.td}>{user.email}</td>
              <td className={styles.td}>{user.roles.join(", ")}</td>
              <td className={styles.td}>
                <button
                  onClick={() => setEditUser(user)}
                  className={styles.editButton}
                >
                  Редактировать
                </button>
                <button
                  onClick={() => deleteUser(user.id)}
                  className={styles.deleteButton}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.pagination}>
        <button
          onClick={handlePreviousPage}
          disabled={page === 1}
          className={styles.paginationButton}
        >
          Предыдущая
        </button>
        <span>Страница {page} из {totalPages}</span>
        <button
          onClick={handleNextPage}
          disabled={page === totalPages}
          className={styles.paginationButton}
        >
          Следующая
        </button>
      </div>
    </div>
  );
};

export default UserManagement;