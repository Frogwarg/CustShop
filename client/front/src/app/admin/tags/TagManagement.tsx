"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import authService from "../../services/authService";
import useDebounce from "../../utils/useDebounce";
import styles from "./TagManagement.module.css";

interface Tag {
  id: string;
  name: string;
}

interface TagResponse { 
  tags: Tag[];
  totalCount: number;
}

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [editTag, setEditTag] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  const fetchTags = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(debouncedSearch && { search: debouncedSearch }),
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      const response = await authService.axiosWithRefresh<TagResponse>("get", `/admin/tags?${queryParams.toString()}`);
      setTags(response?.tags || []);
      const totalCount = Math.ceil((response?.totalCount || 0) / pageSize);
      setTotalPages(totalCount != 0 ? totalCount : 1);
    } catch (error) {
      toast.error("Ошибка загрузки тегов");
      console.error(error);
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Название тега не может быть пустым");
      return;
    }
    try {
      await authService.axiosWithRefresh("post", "/admin/tags", { name: newTagName });
      setNewTagName("");
      fetchTags();
      toast.success("Тег создан");
    } catch (error) {
      toast.error("Ошибка создания тега");
      console.error(error);
    }
  };

  const updateTag = async () => {
    if (!editTag || !editTag.name.trim()) {
      toast.error("Название тега не может быть пустым");
      return;
    }
    try {
      await authService.axiosWithRefresh("put", `/admin/tags/${editTag.id}`, { name: editTag.name });
      setEditTag(null);
      fetchTags();
      toast.success("Тег обновлён");
    } catch (error) {
      toast.error("Ошибка обновления тега");
      console.error(error);
    }
  };

  const deleteTag = async (id: string) => {
    try {
      await authService.axiosWithRefresh("delete", `/admin/tags/${id}`);
      fetchTags();
      toast.success("Тег удалён");
    } catch (error) {
      toast.error("Ошибка удаления тега");
      console.error(error);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Управление тегами</h2>
      <div className={styles.nav}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по тегам"
          className={styles.input}
        />
        <div className={styles.form}>
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Новый тег"
            className={styles.input}
          />
          <button onClick={createTag} className={styles.addButton}>
            Добавить
          </button>
        </div>
      </div>
      {editTag && (
        <div className={styles.form}>
          <input
            type="text"
            value={editTag.name}
            onChange={(e) => setEditTag({ ...editTag, name: e.target.value })}
            className={styles.input}
          />
          <button onClick={updateTag} className={styles.saveButton}>
            Сохранить
          </button>
          <button
            onClick={() => setEditTag(null)}
            className={styles.cancelButton}
          >
            Отмена
          </button>
        </div>
      )}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Название</th>
            <th className={styles.th}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr key={tag.id} className={styles.tr}>
              <td className={styles.td}>{tag.name}</td>
              <td className={styles.td}>
                <button
                  onClick={() => setEditTag({ id: tag.id, name: tag.name })}
                  className={styles.editButton}
                >
                  Редактировать
                </button>
                <button
                  onClick={() => deleteTag(tag.id)}
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

export default TagManagement;