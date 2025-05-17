"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import authService from "../../services/authService";
import useDebounce from "../../utils/useDebounce";
import styles from "./DesignManagement.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Design {
  id: string;
  userId?: string;
  userName: string;
  name: string;
  description: string;
  productType: string;
  previewUrl: string;
  createdAt: string;
  moderationStatus: string;
  moderatorComment: string;
}

interface DesignResponse {
  designs: Design[];
  totalCount: number;
}

const DesignManagement: React.FC = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [search, setSearch] = useState("");
  const [moderationStatus, setModerationStatus] = useState("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [editDesign, setEditDesign] = useState<Design | null>(null);
  const router = useRouter();

  const debouncedSearch = useDebounce(search, 500);
  const debouncedUserId = useDebounce(userId, 500);

  useEffect(() => {
    fetchDesigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, moderationStatus, debouncedUserId, page]);

  const fetchDesigns = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(moderationStatus && { moderationStatus }),
        ...(debouncedUserId && { userId: debouncedUserId }),
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await authService.axiosWithRefresh<DesignResponse>(
        "get",
        `/admin/designs?${queryParams.toString()}`
      );
      setDesigns(response?.designs || []);
      const totalCount = Math.ceil((response?.totalCount || 0) / pageSize);
      setTotalPages(totalCount != 0 ? totalCount : 1);
    } catch (error) {
      toast.error("Ошибка загрузки дизайнов");
      console.error(error);
    }
  };

  const updateDesign = async () => {
    if (!editDesign) return;
    try {
      await authService.axiosWithRefresh("put", `/admin/designs/${editDesign.id}`, {
        name: editDesign.name,
        description: editDesign.description,
        moderationStatus: editDesign.moderationStatus,
        moderatorComment: editDesign.moderatorComment,
      });
      setEditDesign(null);
      fetchDesigns();
      toast.success("Дизайн обновлён");
    } catch (error) {
      toast.error("Ошибка обновления дизайна");
      console.error(error);
    }
  };

  const deleteDesign = async (id: string) => {
    try {
      await authService.axiosWithRefresh("delete", `/admin/designs/${id}`);
      fetchDesigns();
      toast.success("Дизайн удалён");
    } catch (error) {
      toast.error("Ошибка удаления дизайна");
      console.error(error);
    }
  };

  const editDesignHandler = (designId: string) => {
        router.push(`/constructor?designId=${designId}`);
    };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Управление дизайнами</h2>
      <div className={styles.form}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию или описанию"
          className={styles.input}
        />
        <select
          value={moderationStatus}
          onChange={(e) => setModerationStatus(e.target.value)}
          className={styles.input}
        >
          <option value="">Все статусы</option>
          <option value="Draft">Черновик</option>
          <option value="Pending">На модерации</option>
          <option value="Approved">Одобрен</option>
          <option value="Rejected">Отклонён</option>
        </select>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="ID автора"
          className={styles.input}
        />
      </div>
      {editDesign && (
        <div className={styles.form}>
          <input
            type="text"
            value={editDesign.name}
            onChange={(e) => setEditDesign({ ...editDesign, name: e.target.value })}
            placeholder="Название"
            className={styles.input}
          />
          <textarea
            value={editDesign.description}
            onChange={(e) => setEditDesign({ ...editDesign, description: e.target.value })}
            placeholder="Описание"
            className={styles.input}
          />
          <select
            value={editDesign.moderationStatus}
            onChange={(e) => setEditDesign({ ...editDesign, moderationStatus: e.target.value })}
            className={styles.input}
          >
            <option value="Draft">Черновик</option>
            <option value="Pending">На модерации</option>
            <option value="Approved">Одобрен</option>
            <option value="Rejected">Отклонён</option>
          </select>
          <textarea
            value={editDesign.moderatorComment}
            onChange={(e) => setEditDesign({ ...editDesign, moderatorComment: e.target.value })}
            placeholder="Комментарий модератора"
            className={styles.input}
          />
          <button onClick={updateDesign} className={styles.saveButton}>
            Сохранить
          </button>
          <button onClick={() => setEditDesign(null)} className={styles.cancelButton}>
            Отмена
          </button>
        </div>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Превью</th>
            <th className={styles.th}>Автор</th>
            <th className={styles.th}>Название</th>
            <th className={styles.th}>Описание</th>
            <th className={styles.th}>Тип продукта</th>
            <th className={styles.th}>Дата создания</th>
            <th className={styles.th}>Статус модерации</th>
            <th className={styles.th}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {designs.map((design) => (
            <tr key={design.id} className={styles.tr}>
              <td className={styles.td}>
                <Image
                  src={design.previewUrl}
                  alt={design.name}
                  width={50}
                  height={50}
                  className={styles.previewImage}
                />
              </td>
              <td className={styles.td}>
                <Link href={`/admin?tab=users&search=${design.userId}`}>
                  {design.userName} {design.userId != null ? `(${design.userId})` : ""}
                </Link>
              </td>
              <td className={styles.td}>{design.name}</td>
              <td className={styles.td}>{design.description}</td>
              <td className={styles.td}>{design.productType}</td>
              <td className={styles.td}>{new Date(design.createdAt).toLocaleString()}</td>
              <td className={styles.td}>{design.moderationStatus}</td>
              <td className={styles.td}>
                <button className={styles.editConstructorButton} onClick={() => editDesignHandler(design.id)}>
                    Редактировать в конструкторе
                  </button>
                <button
                  onClick={() => setEditDesign(design)}
                  className={styles.editButton}
                >
                  Редактировать
                </button>
                <button
                  onClick={() => deleteDesign(design.id)}
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

export default DesignManagement;