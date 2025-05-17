"use client";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from 'sonner';
import authService from "../../services/authService";
import styles from '../styles.module.css';

interface ShareDesignFormProps {
    designId: string;
    onClose: () => void;
    onSubmit: () => void;
}

const ShareDesignForm: React.FC<ShareDesignFormProps> = ({ designId, onClose, onSubmit }) => {
    const { isAuthenticated } = useAuth();
    const [formData, setFormData] = useState({ name: "", description: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error("Пожалуйста, войдите в систему.");
            return;
        }
        try {
            await authService.axiosWithRefresh('post', `/Design/${designId}/share`, formData);
            onSubmit();
            toast.success("Дизайн отправлен на модерацию!");
        } catch (error) {
            console.error("Ошибка:", error);
            toast.error("Произошла ошибка.");
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h2 className={styles.modalTitle}>Поделиться дизайном</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <input
                        type="text"
                        placeholder="Название"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className={styles.input}
                    />
                    <textarea
                        placeholder="Описание"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        className={styles.textarea}
                    />
                    <div className={styles.buttonGroup}>
                        <button type="submit" className={styles.submitButton}>Отправить</button>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShareDesignForm;