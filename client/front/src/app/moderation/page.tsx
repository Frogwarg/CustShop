"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Image from 'next/image';
import { toast } from "sonner";
import authService from "../services/authService";

interface Design {
    id: string;
    name: string;
    description: string;
    previewUrl: string;
}

interface FormData {
    [key: string]: {
        price: string;
        tagIds: string[];
        comment: string;
    };
}

const ModerationPage = () => {
    const { hasRole } = useAuth();
    const [designs, setDesigns] = useState<Design[]>([]);
    const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<FormData>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch pending designs
                const designsResponse = await authService.axiosWithRefresh<Design[]>("get", "/Moderation/pending");
                setDesigns(designsResponse);
                
                // Fetch available tags
                await authService
                    .axiosWithRefresh<{ id: string; name: string }[]>("get", "/design/tags")
                    .then((response) => {
                        setAvailableTags(response || []);
                    })
                    .catch((error) => {
                        toast.error("Ошибка загрузки тегов");
                        console.error(error);
                    });
                
                // Initialize form data
                setFormData(designsResponse.reduce((acc: FormData, d) => ({
                    ...acc,
                    [d.id]: { price: "", tagIds: [], comment: "" }
                }), {}));
            } catch (error) {
                console.error("Ошибка:", error);
            } finally {
                setLoading(false);
            }
        };
        
        if (hasRole("Moderator")) fetchData();
    }, [hasRole]);

    const handleDecision = async (designId: string, action: 'approve' | 'reject') => {
        const design = designs.find((d) => d.id === designId);
        if (!design) return;

        const data = {
            name: design.name,
            description: design.description,
            price: parseFloat(formData[designId].price),
            tagIds: formData[designId].tagIds,
            moderatorComment: formData[designId].comment,
        };
        try {
            const response = authService.axiosWithRefresh("post", `/Moderation/${designId}/${action}`, JSON.stringify(action === "approve" ? data : { moderatorComment: data.moderatorComment }));
            if (!response) throw new Error("Ошибка");
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
                    <select
                        multiple
                        value={formData[design.id]?.tagIds || []}
                        onChange={(e) => setFormData({ 
                            ...formData, 
                            [design.id]: { 
                                ...formData[design.id], 
                                tagIds: Array.from(e.target.selectedOptions, (option) => option.value)
                            }
                        })}
                        style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px' }}
                    >
                        {availableTags.map((tag) => (
                            <option key={tag.id} value={tag.id}>
                                {tag.name}
                            </option>
                        ))}
                    </select>
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