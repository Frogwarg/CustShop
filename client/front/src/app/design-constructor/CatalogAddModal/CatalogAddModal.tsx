"use client";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import authService from "../../services/authService";
import styles from "./CatalogAddModal.module.css";

interface CatalogAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    price: number;
    tagIds: string[];
    moderationStatus: "Approved" | "Rejected";
  }) => void;
}

interface Tag {
  id: string;
  name: string;
}

interface TagResponse { 
  tags: Tag[];
  totalCount: number;
}

const CatalogAddModal: React.FC<CatalogAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [moderationStatus, setModerationStatus] = useState<"Approved" | "Rejected">("Approved");
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      authService
        .axiosWithRefresh<TagResponse>("get", "/admin/tags")
        .then((response) => {
          setAvailableTags(response.tags || []);
        })
        .catch((error) => {
          toast.error("Ошибка загрузки тегов");
          console.error(error);
        });
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!name.trim() || !description.trim() || price <= 0 || tagIds.length === 0) {
      toast.error("Заполните все поля корректно");
      return;
    }

    onSubmit({
      name,
      description,
      price,
      tagIds,
      moderationStatus,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Добавить дизайн в каталог</h2>
        <div className="mb-4">
          <label className={styles.label}>Название</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.inputField}
          />
        </div>
        <div className="mb-4">
          <label className={styles.label}>Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textareaField}
          />
        </div>
        <div className="mb-4">
          <label className={styles.label}>Цена</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className={styles.inputField}
            min="0"
          />
        </div>
        <div className="mb-4">
          <label className={styles.label}>Теги</label>
          <select
            multiple
            value={tagIds}
            onChange={(e) =>
              setTagIds(
                Array.from(e.target.selectedOptions, (option) => option.value)
              )
            }
            className={styles.selectField}
          >
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className={styles.label}>Статус</label>
          <select
            value={moderationStatus}
            onChange={(e) =>
              setModerationStatus(e.target.value as "Approved" | "Rejected")
            }
            className={styles.selectField}
          >
            <option value="Approved">Одобрен</option>
            <option value="Rejected">Отклонён</option>
          </select>
        </div>
        <div className={styles.buttonContainer}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            className={styles.submitButton}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default CatalogAddModal;