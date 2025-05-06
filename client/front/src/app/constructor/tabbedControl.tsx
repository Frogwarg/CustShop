import { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import Image from 'next/image';
import { Layer } from './Layers/useLayers';
import { createFilterByName } from '../utils/lib';

const TabbedControls = ({ selectedObject, onUpdateObject }: { selectedObject: fabric.Object | null, onUpdateObject: (obj: Partial</*fabric.Text*/Layer> ) => void }) => {
    const [activeTab, setActiveTab] = useState<'product' | 'object'>('product');
    const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF'); // Цвет товара
    const [selectedSize, setSelectedSize] = useState<string>('M'); // Размер товара
    const [selectedFilter, setSelectedFilter] = useState<string[] | null>(null); // Выбранный фильтр
    const [brightnessValue, setBrightnessValue] = useState<number>(0);
    const [objectText, setObjectText] = useState('');
    const [objectFont, setObjectFont] = useState('Arial');
    const [objectColor, setObjectColor] = useState('#000000'); // Цвет текста

    const filterOptions: { name: string; options?: Record<string, number | string>; preview: string }[] = [
      { name: 'Brightness', options: { brightness: 0 }, preview: '/filters/brightness.png' },
      { name: 'Grayscale', options: {}, preview: '/filters/grayscale.png' },
      { name: 'Sepia', options: {}, preview: '/filters/sepia.png' },
      { name: 'Invert', options: {}, preview: '/filters/invert.png' },
  ];
    const handleVerticalAlign = () => {
        if (!selectedObject) return;
        const newFlipY = !selectedObject.flipY; // Переключаем отражение по вертикали
        selectedObject.set({ flipY: newFlipY });
        selectedObject.canvas?.renderAll();
        onUpdateObject({ flipY: newFlipY });
    };

    const handleHorizontalAlign = () => {
        if (!selectedObject) return;
        const newFlipX = !selectedObject.flipX; // Переключаем отражение по горизонтали
        selectedObject.set({ flipX: newFlipX });
        selectedObject.canvas?.renderAll();
        onUpdateObject({ flipX: newFlipX });
    };

    useEffect(() => {
        if (selectedObject?.type === 'text') {
            const textObject = selectedObject as fabric.Text;
            setObjectText(textObject.text || '');
            setObjectFont(textObject.fontFamily || 'Arial');
            setObjectColor(typeof textObject.fill === 'string' ? textObject.fill : '#000000');
        }
        if (selectedObject?.type === 'image') {
          const img = selectedObject as fabric.Image;
          const currentFilters = img.filters || [];

          // Синхронизируем selectedFilter с текущими фильтрами
          const activeFilterNames = currentFilters
              .filter((f) => f?.toObject().type)
              .map((f) => f.toObject().type);
          setSelectedFilter(activeFilterNames.length > 0 ? activeFilterNames : null);
      } else {
          setSelectedFilter(null);
      }
    }, [selectedObject]);

    const applyFilter = (filterName: string, options?: Record<string, number | string>) => {
      if (!selectedObject || selectedObject.type !== 'image') return;
      const img = selectedObject as fabric.Image;
      
      const currentFilters = img.filters || [];
      const isFilterApplied = currentFilters.some((f) => f?.toObject().type === filterName);
      
      let newFilters: fabric.IBaseFilter[];
      let newSelectedFilters: string[];
    
      if (isFilterApplied) {
        // Удаляем фильтр
        newFilters = currentFilters.filter((f) => f?.toObject().type !== filterName);
        newSelectedFilters = (selectedFilter || []).filter((name) => name !== filterName);
      } else {
        // Добавляем фильтр
        const filterOptions = filterName === 'Brightness' ? { brightness: brightnessValue } : options;
        const newFilter = createFilterByName(filterName, filterOptions);
        if (!newFilter) {
          return;
        }
        newFilters = [...currentFilters, newFilter];
        newSelectedFilters = [...(selectedFilter || []), filterName];
      }    
      img.filters = newFilters;
      img.applyFilters();
      img.canvas?.renderAll();
    
      // Обновляем состояние слоя
      onUpdateObject({
        filters: newFilters.map((f) => ({
          name: f.toObject().type,
          options: { ...f, type: undefined },
        })),
      });
    
      setSelectedFilter(newSelectedFilters);
    };
      
    const updateBrightnessFilter = (brightness: number) => {
      if (!selectedObject || selectedObject.type !== 'image') return;
      const img = selectedObject as fabric.Image;
      const currentFilters = img.filters || [];

      // Удаляем старый фильтр Brightness
      const newFilters = currentFilters.filter((f) => f?.toObject().type !== 'Brightness');

      // Добавляем новый фильтр Brightness с указанным значением
      const newFilter = createFilterByName('Brightness', { brightness });
      if (newFilter) {
          newFilters.push(newFilter);
      }

      img.filters = newFilters;
      img.applyFilters();
      img.canvas?.renderAll();

      // Обновляем состояние слоя
      onUpdateObject({
          filters: newFilters.map((f) => ({
              name: f.toObject().type,
              options: { ...f, type: undefined },
          })),
      });

      setSelectedFilter((prev) => {
          const updated = (prev || []).filter((name) => name !== 'Brightness');
          return [...updated, 'Brightness'];
      });
  };

    const resetFilters = () => {
      if (!selectedObject || selectedObject.type !== 'image') return;
      const img = selectedObject as fabric.Image;

      // Очищаем фильтры
      img.filters = [];
      img.applyFilters();
      img.canvas?.renderAll();

      // Обновляем состояние слоя
      onUpdateObject({
          filters: [],
      });
      setSelectedFilter(null);
      setBrightnessValue(0);
    };

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
                            <label>Фильтры:</label>
                            <div className="filter-panel" style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                                {filterOptions.map((filter) => (
                                    <div key={filter.name} onClick={() => applyFilter(filter.name, filter.options)} style={{ cursor: 'pointer' }}>
                                        <Image
                                            src={filter.preview}
                                            alt={`Filter preview: ${filter.name}`}
                                            width={80}
                                            height={80}
                                            style={{
                                                border: selectedFilter?.includes(filter.name) ? '2px solid blue' : '1px solid gray',
                                                display: 'block',
                                            }}
                                        />
                                        <div style={{ textAlign: 'center', fontSize: 12 }}>{filter.name}</div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={resetFilters} style={{ marginTop: 10 }}>Сбросить фильтры</button>
                            {selectedFilter?.includes('Brightness') && (
                                <div style={{ marginTop: 10 }}>
                                    <label>Уровень яркости: {brightnessValue}</label>
                                    <input
                                        type="range"
                                        min={-1}
                                        max={1}
                                        step={0.1}
                                        value={brightnessValue}
                                        onChange={(e) => {
                                            const newValue = parseFloat(e.target.value);
                                            setBrightnessValue(newValue);
                                            updateBrightnessFilter(newValue);
                                        }}
                                    />
                                </div>
                            )}
                        </>
                    )}
                    {selectedObject.type === 'text' && (
                        <>  
                            {/* Настройки текста */}
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
