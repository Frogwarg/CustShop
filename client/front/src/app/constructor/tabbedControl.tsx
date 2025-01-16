import { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import Image from 'next/image';

const TabbedControls = ({ selectedObject, onUpdateObject }: { selectedObject: fabric.Object | null, onUpdateObject: (obj: Partial<fabric.Text>) => void }) => {
    const [activeTab, setActiveTab] = useState<'product' | 'object'>('product');
    const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF'); // Цвет товара
    const [selectedSize, setSelectedSize] = useState<string>('M'); // Размер товара
    const [selectedFilter, setSelectedFilter] = useState<string>('none'); // Выбранный фильтр
    const [objectText, setObjectText] = useState('');
    const [objectFont, setObjectFont] = useState('Arial');
    const [objectColor, setObjectColor] = useState('#000000'); // Цвет текста

    const handleVerticalAlign = () => {
        console.log('Align vertically');
    };

    const handleHorizontalAlign = () => {
        console.log('Align horizontally');
    };

    useEffect(() => {
        if (selectedObject?.type === 'text') {
            const textObject = selectedObject as fabric.Text;
            setObjectText(textObject.text || '');
            setObjectFont(textObject.fontFamily || 'Arial');
            setObjectColor(typeof textObject.fill === 'string' ? textObject.fill : '#000000');
        }
    }, [selectedObject]);

    return (
        <div>
            {/* Таб переключения */}
            <div style={{ display: 'flex', marginBottom: '10px' }}>
                <button 
                    onClick={() => setActiveTab('product')} 
                    style={{ flex: 1, backgroundColor: activeTab === 'product' ? '#ddd' : '#fff' }}
                >
                    Продукт
                </button>
                <button 
                    onClick={() => setActiveTab('object')} 
                    style={{ flex: 1, backgroundColor: activeTab === 'object' ? '#ddd' : '#fff' }}
                >
                    Объект
                </button>
            </div>

            {/* Секции вкладок */}
            {activeTab === 'product' && (
                <div>

                    <h3>Настройки товара</h3>
                    <label>
                        Цвет:
                        <input 
                            type="color" 
                            value={selectedColor} 
                            onChange={(e) => setSelectedColor(e.target.value)} 
                        />
                    </label>
                    <label>
                        Размер:
                        <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                        </select>
                    </label>
                </div>
            )}

            {activeTab === 'object' && selectedObject && (
                <div>
                    <h3>Настройки объекта</h3>
                    {/* Общие кнопки */}
                    <button onClick={handleVerticalAlign}>Отобразить по вертикали</button>
                    <button onClick={handleHorizontalAlign}>Отобразить по горизонтали</button>

                    {selectedObject.type === 'image' && (
                        <>
                            <label>
                            Фильтры:
                            <select value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
                                <option value="none">Без фильтра</option>
                                <option value="grayscale">Чёрно-белый</option>
                                <option value="sepia">Сепия</option>
                            </select>
                            </label>
                            <div>
                                <Image 
                                    src="/path/to/image" 
                                    alt="Preview" 
                                    width={500} 
                                    height={500} 
                                    style={{ filter: selectedFilter }} 
                                />
                            </div>  
                        </>
                    )}
                    {selectedObject.type === 'text' && (
                        <>  
                            {/* Настройки текста */}
                            {/** Предположим, что выбран объект - текст */}
                            <label>
                                Изменить текст:
                                <input 
                                    type="text" 
                                    value={objectText}
                                    onChange={(e) => {
                                        setObjectText(e.target.value);
                                        onUpdateObject({ text: e.target.value });
                                    }} 
                                />
                            </label>
                            <label>
                                Шрифт:
                                <select value={objectFont} onChange={(e) => {
                                                setObjectFont(e.target.value);
                                                onUpdateObject({ fontFamily: e.target.value });
                                            }}>
                                    <option value="Arial">Arial</option>
                                    <option value="Verdana">Verdana</option>
                                    <option value="Times New Roman">Times New Roman</option>
                                </select>
                            </label>
                            <label>
                                Цвет текста:
                                <input 
                                    type="color" 
                                    value={objectColor} 
                                    onChange={(e) => {
                                        setObjectColor(e.target.value);
                                        onUpdateObject({ fill: e.target.value });
                                    }}
                                />
                            </label>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default TabbedControls;
