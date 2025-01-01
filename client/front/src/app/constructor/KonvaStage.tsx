import Konva from 'konva';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Text, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import Image from 'next/image';

const KonvaStage = () => {
  interface Layer {
    id: number | string;
    type: 'image' | 'text';
    image?: HTMLImageElement;
    text?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    url?: string | ArrayBuffer | null;
    fontSize?: number;
    rotation?: number;
  }
  
  const [layers, setLayers] = useState<Layer[]>([]); // Массив для всех слоёв
  const [selectedLayerId, setSelectedLayerId] = useState<number | string | null>(null); // Состояние для выбранного элемента
  const [currentText, setCurrentText] = useState('Your Text Here'); // Для ввода текста
  const [backgroundColor/*, setBackgroundColor*/] = useState('#FFFFFF'); // Цвет фона можно будет изменить
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null); // Для хранения изображения маски
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth * 0.8, height: window.innerHeight});
  const canvasRef = useRef<Konva.Stage | null>(null);
  const textRef = useRef<Konva.Text>(null); // Ссылка на текстовый элемент
  const transformerRef = useRef<Konva.Transformer>(null);

  const maskWidth = 800;
  const maskHeight= 800;

  // Функция для обновления размера канваса
  const updateCanvasSize = () => {
    const newWidth = window.innerWidth * 0.8; // 80% от ширины окна
    const newHeight = window.innerHeight * 0.8; // 80% от высоты окна
    setCanvasSize({ width: newWidth, height: newHeight });
  };

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  // Добавляем изображение маски (ссылка на изображение или путь)
  const maskImageSrc = '/products/shirt-mask.png';

  // Загружаем маску после монтирования
  useEffect(() => {
    const img = new window.Image();
    img.src = maskImageSrc;
    img.onload = () => {
      setMaskImage(img); // Сохраняем изображение маски в state
    };
  }, []);

  useEffect(() => {
    if (selectedLayerId && transformerRef.current) {
      if (!canvasRef.current) return;
      const stage = canvasRef.current?.getStage();
      const selectedNode = stage.findOne('#' + selectedLayerId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        const layer = transformerRef.current.getLayer();
        if (layer) {
          layer.batchDraw();
        }
      }
    }
  }, [selectedLayerId]);

  // Функция для загрузки пользовательских изображений
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.crossOrigin = "anonymous"; 
      if (reader.result) {
        img.src = reader.result as string;
      }
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const newWidth = 200;
        const newHeight = newWidth / aspectRatio;
        setLayers((prevLayers) => [
          ...prevLayers,
          { 
            id: 'layer-' + Date.now(), 
            type: 'image', 
            image: img, 
            x: canvasSize.width / 2 - newWidth / 2, 
            y: canvasSize.height / 2 - newHeight / 2, 
            width: newWidth,
            height: newHeight,
            url: reader.result 
          }
        ]);
      };
    };

    reader.readAsDataURL(file);
  };

  // Функция для добавления текста
  const handleAddText = () => {
    setLayers((prevLayers) => [
      ...prevLayers,
      { 
        id: 'layer-' + Date.now(), 
        type: 'text', 
        text: currentText, 
        x: canvasSize.width / 2, 
        y: canvasSize.height / 2,
        fontSize: 30,
        width: 200,
        height: 30
      }
    ]);
    setCurrentText('');
  };

  const handleSelectLayer = useCallback((layerId: number | string) => {
    setSelectedLayerId(layerId);
  }, []);

  // Функция для сохранения дизайна
  const saveDesign = () => {
    const stage = canvasRef.current?.getStage();
    if (stage) {
      // Сохраняем текущее состояние
      const selectedId = selectedLayerId;
      const transformer = transformerRef.current;
      const nodes = stage.find('Image, Text');
  
      // Убираем выделение и трансформер
      setSelectedLayerId(null);
      if (transformer) {
        transformer.nodes([]);
      }
  
      // Убираем обводку у текстовых элементов
      nodes.forEach(node => {
        if (node instanceof Konva.Text || node instanceof Konva.Shape) {
          node.strokeEnabled(false);
        }
      });
  
      // Делаем снимок сцены
      const dataURL = stage.toDataURL();
  
      // Восстанавливаем состояние
      setSelectedLayerId(selectedId);
      if (transformer && selectedId) {
        const selectedNode = stage.findOne('#' + selectedId);
        if (selectedNode) {
          transformer.nodes([selectedNode]);
          const layer = transformer.getLayer();
          if (layer){
            layer.batchDraw();
          }
        }
      }
      nodes.forEach(node => {
        if (node instanceof Konva.Text || node instanceof Konva.Shape) {
          node.strokeEnabled(true);
        }
      });

      stage.batchDraw();
  
      // Сохраняем изображение
      const link = document.createElement('a');
      link.download = 'design.png';
      link.href = dataURL;
      link.click();

      setTimeout(() => {
        setSelectedLayerId(selectedId);
        if (transformer && selectedId) {
          const selectedNode = stage.findOne('#' + selectedId);
          if (selectedNode) {
            transformer.nodes([selectedNode]);
            // Явно показываем трансформер
            transformer.show();
            // Обновляем слой трансформера
            const layer = transformer.getLayer();
            if (layer){
                layer.batchDraw();
            }
          }
        }
  
        // Восстанавливаем обводку у всех элементов
        nodes.forEach(node => {
            if (node instanceof Konva.Text || node instanceof Konva.Shape) {
                node.strokeEnabled(true);
            }
        });
  
        stage.batchDraw();
      }, 100);
    }
  };

  const handleLayerChange = useCallback((newAttrs: Layer) => {
    setLayers(prevLayers =>
      prevLayers.map(layer =>
        layer.id === newAttrs.id ? { ...layer, ...newAttrs } : layer
      )
    );
  }, []);
  
  const moveLayer = (index: number, direction: number) => {
    const newLayers = [...layers];
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < layers.length) {
      [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
      setLayers(newLayers);
    }
  };

  useEffect(() => {
    if (selectedLayerId && textRef.current) {
      const textNode = textRef.current;
      const width = textNode.width();
      const height = textNode.height();
      setLayers((prevLayers) =>
        prevLayers.map((layer) =>
          layer.id === selectedLayerId ? { ...layer, width, height } : layer
        )
      );
    }
  }, [selectedLayerId]);

  interface LayerComponentProps {
    layerProps: Layer;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (newAttrs: Layer) => void;
  }

  const LayerComponent: React.FC<LayerComponentProps> = ({ layerProps, isSelected, onSelect, onChange }) => {
    const shapeRef = useRef<Konva.Shape>(null);
  
    useEffect(() => {
      if (isSelected && transformerRef.current) {
        if (shapeRef.current) {
          transformerRef.current.nodes([shapeRef.current]);
        }
        
        const layer = transformerRef.current.getLayer();
        if (layer) {
          layer.batchDraw();
        }
      }
    }, [isSelected]);
  
    const handleTransformEnd = () => {
      const node = shapeRef.current;
      if (node) {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
    
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          ...layerProps,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
          rotation: node.rotation()
        });
      }
    };

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onSelect();

      e.target.moveToTop();
    };
  
    const handleDragStart = () => {
      onSelect();
    };
  
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
      onChange({
        ...layerProps,
        x: e.target.x(),
        y: e.target.y(),
      });
    };
  
    const commonProps = {
      id: String(layerProps.id),
      x: layerProps.x,
      y: layerProps.y,
      rotation: layerProps.rotation,
      onMouseDown: handleMouseDown,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onTransformEnd: handleTransformEnd,
      draggable: true
    };
  
    if (layerProps.type === 'image') {
      return (
        <KonvaImage
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Image>}
          image={layerProps.image}
          width={layerProps.width}
          height={layerProps.height}
        />
      );
    } else if (layerProps.type === 'text') {
      return (
        <Text
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Text>}
          text={layerProps.text}
          fontSize={layerProps.fontSize}
          width={layerProps.width}
          height={layerProps.height}
        />
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', justifyContent:'space-between' }}>
      {/* Панель управления */}
      <div style={{ width: '200px', marginRight: '20px' }}>
        <h3>Layers</h3>
        {/* Список слоёв */}
        {layers.slice().reverse().map((layer, index) => (
          <div 
            key={layer.id}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '5px',
              backgroundColor: layer.id === selectedLayerId ? '#e0e0e0' : 'transparent' }}
            onClick={() => handleSelectLayer(layer.id)}
          >
            {layer.type === 'image' ? 
                (<Image src={layer.url as string} alt="layer thumbnail" style={{ width: '50px', height: '50px', objectFit: 'cover' }}/>) 
               :(<span>{`Text: "${layer.text}"`}</span>)
            }
            <div>
              {/* Кнопки перемещения слоёв */}
              <button onClick={() => moveLayer(layers.length - 1 - index, 1)}>Up</button>
              <button onClick={() => moveLayer(layers.length - 1 - index, -1)}>Down</button>
            </div>
          </div>
        ))}
      </div>

      <div>
        {/* Создаем канвас */}
        <Stage 
          width={canvasSize.width} 
          height={canvasSize.height}  
          ref={canvasRef} 
          style={{border: '1px solid black'}} 
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) {
              setSelectedLayerId(null);
            }
          }}
        >
          <Layer>
            {/* Фоновый элемент, который можно будет менять по цвету */}
            <Rect
              x={canvasSize.width / 2 - (maskWidth / 2)}
              y={canvasSize.height / 2 - (maskHeight / 2)}
              width={maskWidth}
              height={maskHeight}
              fill={backgroundColor}
              draggable={false} // Фон не перетаскиваемый
            />
            {/* Пользовательские слои (текст и изображения) */}
            {layers.map((layer) => (
              <LayerComponent
                key={layer.id}
                layerProps={layer}
                isSelected={layer.id === selectedLayerId}
                // onMouseDown={() => setSelectedLayerId(layer.id)}
                onSelect={() => handleSelectLayer(layer.id)}
                onChange={handleLayerChange}
              />
            ))}
          </Layer>
          {/* Маска товара поверх всего */}
          {maskImage && (
            <Layer listening={false}>
              <KonvaImage
                image={maskImage}
                x={canvasSize.width / 2 - (maskWidth / 2)}
                y={canvasSize.height / 2 - (maskHeight / 2)}
                width={maskWidth}
                height={maskHeight}
                style={{ 
                  minWidth:canvasSize.width, 
                  zIndex: 100
                }}
                draggable={false}
              />
            </Layer>
          )}
          <Layer>
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>

      <div>
          <input type="file" onChange={handleImageUpload} />
          <input
            type="text"
            value={currentText}
            onChange={(e) => setCurrentText (e.target.value)}
            placeholder="Enter text"
          />
          <button onClick={handleAddText}>Add Text</button>
          <button onClick={saveDesign}>Save Design</button>
      </div>
    </div>
  );
};

export default KonvaStage;