"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import authService from "../../services/authService";
import styles from "./TagManagement.module.css";

interface Tag {
  id: string;
  name: string;
}

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [editTag, setEditTag] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await authService.axiosWithRefresh<Tag[]>("get", "/admin/tags");
      console.log(response);
      setTags(response || []);
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

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Управление тегами</h2>
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
    </div>
  );
};

export default TagManagement;