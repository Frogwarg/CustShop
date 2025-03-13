"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Image from 'next/image';
import { toast } from "sonner";

interface Design {
    id: string;
    name: string;
    description: string;
    previewUrl: string;
}

interface FormData {
    [key: string]: {
        price: string;
        tags: string;
        comment: string;
    };
}

const ModerationPage = () => {
    const { hasRole } = useAuth();
    const [designs, setDesigns] = useState<Design[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<FormData>({});

    useEffect(() => {
        const fetchPendingDesigns = async () => {
            try {
                const response = await fetch("http://localhost:5123/api/Moderation/pending", {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                const data = await response.json();
                setDesigns(data);
                setFormData(data.reduce((acc: FormData, d: Design) => (
                    { ...acc, [d.id]: { price: "", tags: "", comment: "" } }
                ), {}));
            } catch (error) {
                console.error("Ошибка:", error);
            } finally {
                setLoading(false);
            }
        };
        if (hasRole("Moderator")) fetchPendingDesigns();
    }, [hasRole]);

    const handleDecision = async (designId: string, action: 'approve' | 'reject') => {
        const design = designs.find((d) => d.id === designId);
        if (!design) return;

        const data = {
            name: design.name,
            description: design.description,
            price: parseFloat(formData[designId].price),
            tags: formData[designId].tags,
            moderatorComment: formData[designId].comment,
        };
        try {
            const response = await fetch(`http://localhost:5123/api/Moderation/${designId}/${action}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(action === "approve" ? data : { moderatorComment: data.moderatorComment }),
            });
            if (!response.ok) throw new Error("Ошибка");
            setDesigns(designs.filter((d) => d.id !== designId));
            toast.success(`Дизайн ${action === "approve" ? "одобрен" : "отклонён"}`);
        } catch (error) {
            console.error("Ошибка:", error);
        }
    };

    if (!hasRole("Moderator")) return <p>Доступ запрещён.</p>;
    if (loading) return <p>Загрузка...</p>;

    return (
        <div>
            <h1>Модерация дизайнов</h1>
            {designs.map((design) => (
                <div key={design.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
                    <h2>{design.name}</h2>
                    <p>{design.description}</p>
                    <div style={{ position: 'relative', width: '200px', height: '200px' }}>
                        <Image 
                            src={design.previewUrl} 
                            alt={design.name}
                            fill
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <input
                        type="number"
                        placeholder="Цена"
                        value={formData[design.id]?.price || ""}
                        onChange={(e) => setFormData({ ...formData, [design.id]: { ...formData[design.id], price: e.target.value } })}
                    />
                    <input
                        type="text"
                        placeholder="Теги (через запятую)"
                        value={formData[design.id]?.tags || ""}
                        onChange={(e) => setFormData({ ...formData, [design.id]: { ...formData[design.id], tags: e.target.value } })}
                    />
                    <textarea
                        placeholder="Комментарий модератора"
                        value={formData[design.id]?.comment || ""}
                        onChange={(e) => setFormData({ ...formData, [design.id]: { ...formData[design.id], comment: e.target.value } })}
                    />
                    <button onClick={() => handleDecision(design.id, "approve")}>Одобрить</button>
                    <button onClick={() => handleDecision(design.id, "reject")}>Отклонить</button>
                </div>
            ))}
        </div>
    );
};

export default ModerationPage;