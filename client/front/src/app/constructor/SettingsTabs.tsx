import React, { useState, useEffect } from 'react';
import { fabric } from 'fabric';

interface SettingsTabsProps {
    canvasRef: React.RefObject<fabric.Canvas>;
    selectedLayerId: string;
    layers: Array<{ id: string; type: string; url?: string }>;
    setIsModalOpen: (isOpen: boolean) => void;
    saveDesign: () => void;
    handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsTabs: React.FC<SettingsTabsProps> = ({
    canvasRef,
    selectedLayerId,
    layers,
    setIsModalOpen,
    saveDesign,
    handleImageUpload
}) => {
    const [activeTab, setActiveTab] = useState('product');
    const [productColor, setProductColor] = useState('#FFFFFF');
    const [productSize, setProductSize] = useState('M');
    const [imageFilters, setImageFilters] = useState({
        brightness: 0,
        contrast: 0,
        saturation: 0,
    });
    const [textSettings, setTextSettings] = useState({
        text: '',
        fontSize: 30,
        fontFamily: 'Arial',
        color: '#000000'
    });
    
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    // Получаем выбранный объект
    const selectedLayer = layers.find(layer => layer.id === selectedLayerId);
    const selectedObject = canvasRef.current?.getActiveObject();

    // Обновляем настройки при выборе нового объекта
    useEffect(() => {
        if (selectedObject) {
            if (selectedObject.type === 'text') {
                setTextSettings({
                    text: selectedObject.text || '',
                    fontSize: selectedObject.fontSize || 30,
                    fontFamily: selectedObject.fontFamily || 'Arial',
                    color: selectedObject.fill || '#000000'
                });
            }
        }
    }, [selectedObject]);

    // Применяем фильтры к изображению
    const applyImageFilters = () => {
        if (selectedObject && selectedObject.type === 'image') {
            selectedObject.filters = [];
            
            if (imageFilters.brightness !== 0) {
                selectedObject.filters.push(new fabric.Image.filters.Brightness({
                    brightness: imageFilters.brightness
                }));
            }
            if (imageFilters.contrast !== 0) {
                selectedObject.filters.push(new fabric.Image.filters.Contrast({
                    contrast: imageFilters.contrast
                }));
            }
            if (imageFilters.saturation !== 0) {
                selectedObject.filters.push(new fabric.Image.filters.Saturation({
                    saturation: imageFilters.saturation
                }));
            }
            
            selectedObject.applyFilters();
            canvasRef.current?.renderAll();
        }
    };

    // Обработчики изменения текста
    const handleTextChange = (property, value) => {
        if (selectedObject && selectedObject.type === 'text') {
            selectedObject.set(property, value);
            canvasRef.current?.renderAll();
            
            setTextSettings(prev => ({
                ...prev,
                [property]: value
            }));
        }
    };

    // Обработчики отражения объекта
    const handleFlip = (direction) => {
        if (selectedObject) {
            if (direction === 'horizontal') {
                selectedObject.set('flipX', !selectedObject.flipX);
            } else {
                selectedObject.set('flipY', !selectedObject.flipY);
            }
            canvasRef.current?.renderAll();
        }
    };

    // Обработчик изменения размера
    const handleResize = (width, height) => {
        if (selectedObject) {
            selectedObject.set({
                scaleX: width / selectedObject.width,
                scaleY: height / selectedObject.height
            });
            canvasRef.current?.renderAll();
        }
    };

    const styles = {
        container: {
            width: '300px',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '4px'
        },
        tabs: {
            display: 'flex',
            marginBottom: '20px',
            borderBottom: '1px solid #ccc'
        },
        tab: {
            padding: '10px 20px',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom: '2px solid transparent'
        },
        activeTab: {
            borderBottom: '2px solid #007bff',
            color: '#007bff'
        },
        input: {
            width: '100%',
            padding: '8px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
        },
        button: {
            padding: '8px 16px',
            margin: '5px',
            border: 'none',
            borderRadius: '4px',
            background: '#007bff',
            color: 'white',
            cursor: 'pointer'
        },
        colorPicker: {
            width: '100%',
            height: '40px',
            marginBottom: '10px'
        },
        sizeButtons: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            marginBottom: '10px'
        },
        sizeButton: {
            padding: '5px 10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            background: 'white'
        },
        activeSizeButton: {
            background: '#007bff',
            color: 'white',
            border: '1px solid #007bff'
        },
        slider: {
            width: '100%',
            marginBottom: '10px'
        },
        previewContainer: {
            width: '100%',
            height: '200px',
            marginBottom: '10px',
            border: '1px solid #ccc',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.tabs}>
                <button 
                    style={{...styles.tab, ...(activeTab === 'product' ? styles.activeTab : {})}}
                    onClick={() => setActiveTab('product')}
                >
                    Продукт
                </button>
                <button 
                    style={{...styles.tab, ...(activeTab === 'object' ? styles.activeTab : {})}}
                    onClick={() => setActiveTab('object')}
                >
                    Объект
                </button>
            </div>

            {activeTab === 'product' && (
                <div>
                    <button 
                        style={styles.button}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Выбрать товар
                    </button>
                    
                    <label>Цвет товара:</label>
                    <input
                        type="color"
                        value={productColor}
                        onChange={(e) => setProductColor(e.target.value)}
                        style={styles.colorPicker}
                    />

                    <label>Размер:</label>
                    <div style={styles.sizeButtons}>
                        {sizes.map(size => (
                            <button
                                key={size}
                                style={{
                                    ...styles.sizeButton,
                                    ...(productSize === size ? styles.activeSizeButton : {})
                                }}
                                onClick={() => setProductSize(size)}
                            >
                                {size}
                            </button>
                        ))}
                    </div>

                    <button style={styles.button} onClick={saveDesign}>
                        Сохранить дизайн
                    </button>
                </div>
            )}

            {activeTab === 'object' && selectedLayerId && (
                <div>
                    <button 
                        style={styles.button}
                        onClick={() => handleFlip('horizontal')}
                    >
                        Отразить по горизонтали
                    </button>
                    <button 
                        style={styles.button}
                        onClick={() => handleFlip('vertical')}
                    >
                        Отразить по вертикали
                    </button>

                    <div>
                        <label>Ширина:</label>
                        <input
                            type="number"
                            style={styles.input}
                            value={selectedObject?.getScaledWidth() || 0}
                            onChange={(e) => handleResize(parseInt(e.target.value), selectedObject?.getScaledHeight())}
                        />
                    </div>
                    <div>
                        <label>Высота:</label>
                        <input
                            type="number"
                            style={styles.input}
                            value={selectedObject?.getScaledHeight() || 0}
                            onChange={(e) => handleResize(selectedObject?.getScaledWidth(), parseInt(e.target.value))}
                        />
                    </div>

                    {selectedLayer?.type === 'image' ? (
                        <div>
                            <div style={styles.previewContainer}>
                                {selectedLayer.url && (
                                    <img 
                                        src={selectedLayer.url as string} 
                                        alt="preview"
                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                    />
                                )}
                            </div>
                            
                            <label>Яркость:</label>
                            <input
                                type="range"
                                min="-1"
                                max="1"
                                step="0.1"
                                value={imageFilters.brightness}
                                onChange={(e) => {
                                    setImageFilters(prev => ({
                                        ...prev,
                                        brightness: parseFloat(e.target.value)
                                    }));
                                    applyImageFilters();
                                }}
                                style={styles.slider}
                            />

                            <label>Контраст:</label>
                            <input
                                type="range"
                                min="-1"
                                max="1"
                                step="0.1"
                                value={imageFilters.contrast}
                                onChange={(e) => {
                                    setImageFilters(prev => ({
                                        ...prev,
                                        contrast: parseFloat(e.target.value)
                                    }));
                                    applyImageFilters();
                                }}
                                style={styles.slider}
                            />

                            <label>Насыщенность:</label>
                            <input
                                type="range"
                                min="-1"
                                max="1"
                                step="0.1"
                                value={imageFilters.saturation}
                                onChange={(e) => {
                                    setImageFilters(prev => ({
                                        ...prev,
                                        saturation: parseFloat(e.target.value)
                                    }));
                                    applyImageFilters();
                                }}
                                style={styles.slider}
                            />

                            <input 
                                type="file" 
                                onChange={handleImageUpload}
                                style={styles.input}
                            />
                        </div>
                    ) : selectedLayer?.type === 'text' ? (
                        <div>
                            <input
                                type="text"
                                value={textSettings.text}
                                onChange={(e) => handleTextChange('text', e.target.value)}
                                placeholder="Введите текст"
                                style={styles.input}
                            />

                            <select
                                value={textSettings.fontFamily}
                                onChange={(e) => handleTextChange('fontFamily', e.target.value)}
                                style={styles.input}
                            >
                                <option value="Arial">Arial</option>
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Courier New">Courier New</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Verdana">Verdana</option>
                            </select>

                            <input
                                type="number"
                                value={textSettings.fontSize}
                                onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value))}
                                placeholder="Размер шрифта"
                                style={styles.input}
                            />

                            <input
                                type="color"
                                value={textSettings.color}
                                onChange={(e) => handleTextChange('fill', e.target.value)}
                                style={styles.colorPicker}
                            />
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default SettingsTabs;