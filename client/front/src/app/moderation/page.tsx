'use client'
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Image from 'next/image';
import { toast } from 'sonner';
import authService from '../services/authService';
import styles from './styles.module.css';

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
        name: string;
        description: string;
    };
}

const ModerationPage = () => {
    const { hasRole } = useAuth();
    const [designs, setDesigns] = useState<Design[]>([]);
    const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<FormData>({});
    const [editingField, setEditingField] = useState<{ designId: string; field: 'name' | 'description' | null }>({ designId: '', field: null });
    const [isModerator, setIsModerator] = useState<boolean | null>(null);

    useEffect(() => {
        const checkModerator = async () => {
            const moderator = hasRole('Moderator');
            setIsModerator(moderator);
            if (!moderator) {
                setLoading(false);
                return;
            }

            try {
                const designsResponse = await authService.axiosWithRefresh<Design[]>('get', '/Moderation/pending');
                setDesigns(designsResponse);
                
                await authService
                    .axiosWithRefresh<{ id: string; name: string }[]>('get', '/design/tags')
                    .then((response) => {
                        setAvailableTags(response || []);
                    })
                    .catch((error) => {
                        toast.error('Ошибка загрузки тегов');
                        console.error(error);
                    });
                
                setFormData(designsResponse.reduce((acc: FormData, d) => ({
                    ...acc,
                    [d.id]: { price: '', tagIds: [], comment: '', name: d.name, description: d.description }
                }), {}));
            } catch (error) {
                console.error('Ошибка:', error);
            } finally {
                setLoading(false);
            }
        };
        
        checkModerator();
    }, [hasRole]);

    const handleDecision = async (designId: string, action: 'approve' | 'reject') => {
        const design = designs.find((d) => d.id === designId);
        if (!design) return;

        const data = {
            name: formData[designId].name,
            description: formData[designId].description,
            price: parseFloat(formData[designId].price) || 0,
            tagIds: formData[designId].tagIds,
            moderatorComment: formData[designId].comment,
        };
        try {
            await authService.axiosWithRefresh('post', `/Moderation/${designId}/${action}`, action === 'approve' ? data : { moderatorComment: data.moderatorComment });
            setDesigns(designs.filter((d) => d.id !== designId));
            toast.success(`Дизайн ${action === 'approve' ? 'одобрен' : 'отклонён'}`);
        } catch (error) {
            console.error('Ошибка:', error);
            toast.error('Ошибка при обработке дизайна');
        }
    };

    const startEditing = (designId: string, field: 'name' | 'description') => {
        setEditingField({ designId, field });
    };

    const stopEditing = () => {
        setEditingField({ designId: '', field: null });
    };

    const handleFieldChange = (designId: string, field: 'name' | 'description', value: string) => {
        setFormData({ ...formData, [designId]: { ...formData[designId], [field]: value } });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            stopEditing();
        }
    };

    if (isModerator === null || loading) return <p className={styles.loading}>Загрузка...</p>;
    if (!isModerator) return <p className={styles.error}>Доступ запрещён.</p>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Модерация дизайнов</h1>
            <div className={styles.designsList}>
                {designs.map((design) => (
                    <div key={design.id} className={styles.designCard}>
                        {editingField.designId === design.id && editingField.field === 'name' ? (
                            <input
                                type="text"
                                value={formData[design.id].name}
                                onChange={(e) => handleFieldChange(design.id, 'name', e.target.value)}
                                onBlur={stopEditing}
                                onKeyDown={(e) => handleKeyDown(e)}
                                className={styles.editInput}
                                autoFocus
                            />
                        ) : (
                            <div className="designTitle_wrapper">
                                <h2 className={styles.designTitle} onClick={() => startEditing(design.id, 'name')}>
                                    {formData[design.id]?.name || design.name}
                                </h2>
                            </div>
                        )}
                        {editingField.designId === design.id && editingField.field === 'description' ? (
                            <textarea
                                value={formData[design.id].description}
                                onChange={(e) => handleFieldChange(design.id, 'description', e.target.value)}
                                onBlur={stopEditing}
                                onKeyDown={(e) => handleKeyDown(e)}
                                className={styles.editTextarea}
                                autoFocus
                            />
                        ) : (
                            <div className={styles.designDescriptionWrapper}>
                                <p className={styles.designDescription} onClick={() => startEditing(design.id, 'description')}>
                                    {formData[design.id]?.description || design.description}
                                </p>
                            </div>
                        )}
                        <div className={styles.imageWrapper}>
                            <Image 
                                src={design.previewUrl} 
                                alt={design.name}
                                fill
                                className={styles.designImage}
                            />
                        </div>
                        <input
                            type="number"
                            placeholder="Цена"
                            value={formData[design.id]?.price || ''}
                            onChange={(e) => setFormData({ ...formData, [design.id]: { ...formData[design.id], price: e.target.value } })}
                            className={styles.input}
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
                            className={styles.select}
                        >
                            {availableTags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                    {tag.name}
                                </option>
                            ))}
                        </select>
                        <textarea
                            placeholder="Комментарий модератора"
                            value={formData[design.id]?.comment || ''}
                            onChange={(e) => setFormData({ ...formData, [design.id]: { ...formData[design.id], comment: e.target.value } })}
                            className={styles.textarea}
                        />
                        <div className={styles.buttonGroup}>
                            <button onClick={() => handleDecision(design.id, 'approve')} className={styles.approveButton}>Одобрить</button>
                            <button onClick={() => handleDecision(design.id, 'reject')} className={styles.rejectButton}>Отклонить</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ModerationPage;