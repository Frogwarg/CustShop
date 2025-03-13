"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from 'sonner';

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
            const response = await fetch(`http://localhost:5123/api/Design/${designId}/share`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error("Ошибка при отправке");
            onSubmit();
            toast.success("Дизайн отправлен на модерацию!");
        } catch (error) {
            console.error("Ошибка:", error);
            toast.error("Произошла ошибка.");
        }
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: "20px", position: "fixed", top: "20%", left: "20%", background: "white" }}>
            <h2>Поделиться дизайном</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Название"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
                <textarea
                    placeholder="Описание"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                />
                <button type="submit">Отправить</button>
                <button type="button" onClick={onClose}>Отмена</button>
            </form>
        </div>
    );
};

export default ShareDesignForm;