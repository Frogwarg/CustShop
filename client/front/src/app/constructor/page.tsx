"use client"
import { fabric } from 'fabric';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

const DesignProduct = () => {
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
    
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<number | string | null>(null);
    const [currentText, setCurrentText] = useState('Your Text Here');
    const [backgroundColor] = useState('#FFFFFF');
    // const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const [canvasSize, setCanvasSize] = useState(() => {
        if (typeof window !== 'undefined') {
            return { width: window.innerWidth * 0.8, height: window.innerHeight };
        }
        return { width: 800, height: 600 };
    });
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const objectsRef = useRef<fabric.Object[]>([]);

    useEffect(() => {
        const handleResize = () => {
            const newWidth = Math.min(window.innerWidth * 0.8, 1000);
            const newHeight = Math.min(window.innerHeight, 1000);
        
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const overlayImg = canvas.overlayImage;
                
                if (!overlayImg) return;
        
                // Получаем старые и новые координаты области майки
                const oldOverlayLeft = (canvas.width! - overlayImg.width!) / 2;
                const oldOverlayTop = (canvas.height! - overlayImg.height!) / 2;
                const newOverlayLeft = (newWidth - overlayImg.width!) / 2;
                const newOverlayTop = (newHeight - overlayImg.height!) / 2;
        
                canvas.setDimensions({ width: newWidth, height: newHeight });
        
                // Обновляем положение overlay
                overlayImg.set({
                    strokeWidth: 0,
                    stroke: undefined,
                    left: newOverlayLeft,
                    top: newOverlayTop
                });
        
                // Обновляем все объекты
                canvas.getObjects().forEach(obj => {
                    if (obj === overlayImg) return;
        
                    // Вычисляем относительную позицию объекта внутри области майки
                    const relativeX = (obj.left! - oldOverlayLeft) / overlayImg.width!;
                    const relativeY = (obj.top! - oldOverlayTop) / overlayImg.height!;
        
                    // Устанавливаем новую позицию, сохраняя относительное положение
                    obj.set({
                        left: newOverlayLeft + (relativeX * overlayImg.width!),
                        top: newOverlayTop + (relativeY * overlayImg.height!)
                    });
        
                    // Обновляем clipPath
                    obj.clipPath = new fabric.Rect({
                        left: newOverlayLeft + 1,
                        top: newOverlayTop + 1,
                        width: overlayImg.width ? overlayImg.width - 3 : 0,
                        height: overlayImg.height ? overlayImg.height - 3 : 0,
                        absolutePositioned: true
                    });
        
                    obj.setCoords();
                });
        
                canvas.renderAll();
            }
        
            setCanvasSize({ width: newWidth, height: newHeight });
        };
    
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Теперь этот эффект запускается только при монтировании
    
    useEffect(() => {
        // Инициализируем canvas только при первом рендере
        if (!canvasRef.current) {
            const canvas = new fabric.Canvas('canvas', {
                width: canvasSize.width,
                height: canvasSize.height,
                backgroundColor: backgroundColor,
                selection: false,
                controlsAboveOverlay: true
            });
            canvasRef.current = canvas;
    
            fabric.Image.fromURL('/products/shirt-mask.png', (overlayImg) => {
                canvas.setOverlayImage(overlayImg, canvas.renderAll.bind(canvas), {
                    left: (canvasSize.width - overlayImg.width!) / 2,
                    top: (canvasSize.height - overlayImg.height!) / 2,
                });
            });
    
            // Добавляем обработчик клика
            canvas.on('mouse:down', (e) => {
                if (!e.target) {
                    setSelectedLayerId(null);
                    canvas.discardActiveObject().renderAll();
                }
            });
        }
    }, []);
    
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
                const newWidth = img.width > canvasSize.width ? canvasSize.width/2 : img.width/2;
                const newHeight = newWidth / aspectRatio;

                const scaleX = newWidth / img.width;
                const scaleY = newHeight / img.height;
                // const newHeight = newWidth / aspectRatio;
                const fabricImage = new fabric.Image(img, {
                    left: (canvasSize.width - newWidth) / 2,
                    top: (canvasSize.height - newHeight) / 2,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    selectable: true,
                    evented: true,
                    hasBorders: true,
                    hasControls: true,
                });
                const overlayImg = canvasRef.current?.overlayImage;
                if (overlayImg && overlayImg.width && overlayImg.height) {
                    const overlayLeft = (canvasSize.width - overlayImg.width) / 2;
                    const overlayTop = (canvasSize.height - overlayImg.height) / 2;

                    fabricImage.clipPath = new fabric.Rect({
                        left: overlayLeft + 1,
                        top: overlayTop + 1,
                        width: overlayImg.width - 3,
                        height: overlayImg.height - 3,
                        absolutePositioned: true
                    });
                }

                canvasRef.current?.add(fabricImage);
                objectsRef.current = canvasRef.current?.getObjects() || [];

            // Обновляем слои (если используете для интерфейса)
            setLayers((prevLayers) => [
                ...prevLayers,
                { 
                    id: 'layer-' + Date.now(),
                    type: 'image',
                    image: img,
                    x: fabricImage.left || 0,
                    y: fabricImage.top || 0,
                    width: newWidth,
                    height: newHeight,
                    url: reader.result,
                },
            ]);
            };
        };

        reader.readAsDataURL(file);
    };

    const handleAddText = () => {
        const text = new fabric.Text(currentText, {
            left: canvasSize.width / 2,
            top: canvasSize.height / 2,
            fontSize: 30,
        });

        const overlayImg = canvasRef.current?.overlayImage;
            if (overlayImg && overlayImg.width && overlayImg.height) {
                const overlayLeft = (canvasSize.width - overlayImg.width) / 2;
                const overlayTop = (canvasSize.height - overlayImg.height) / 2;
                text.clipPath = new fabric.Rect({
                    left: overlayLeft + 1,
                    top: overlayTop + 1,
                    width: overlayImg.width - 3,
                    height: overlayImg.height - 3,
                    absolutePositioned: true
                });
        }
        canvasRef.current?.add(text);
        objectsRef.current = canvasRef.current?.getObjects() || [];
        setLayers((prevLayers) => [
            ...prevLayers,
            { 
                id: 'layer-' + Date.now(), 
                type: 'text', 
                text: currentText, 
                x: text.left || 0, 
                y: text.top || 0,
                fontSize: 30,
                width: text.width || 200,
                height: text.height || 30
            }
        ]);
        setCurrentText('');
    };

    const handleSelectLayer = (layerId: number | string) => {
        setSelectedLayerId(layerId);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
    
        // Словарь для хранения начальных z-index объектов
        const objectZIndices: Map<fabric.Object, number> = new Map();
    
        const handleSelection = (event: fabric.IEvent) => {
            const target = event.selected ? event.selected[0] : null; // Получаем первый объект из массива selected
            if (target) {
                // Перемещаем объект на самый верх
                canvas.bringToFront(target);
                console.log('selected:', target);
        
                // Сохраняем текущий z-index объекта
                const index = canvas.getObjects().indexOf(target);
                objectZIndices.set(target, index);
                const overlayImage = canvas.overlayImage;
                if (overlayImage) {
                    canvas.sendBackwards(overlayImage);
                }
            }
        };
        
        const handleDeselection = (event: fabric.IEvent) => {
            const deselected = event.deselected; // Массив снятых объектов
            
        
            if (deselected && deselected.length > 0) {
                deselected.forEach((target) => {
                    if (objectZIndices.has(target)) {
                        // Возвращаем объект на исходный z-index
                        const originalIndex = objectZIndices.get(target)!;
                        canvas.remove(target);
                        canvas.insertAt(target, originalIndex, false);
                        objectZIndices.delete(target);
                        console.log('deselected:', deselected); // Лог для проверки снятия выделения
                    }
                });
            }
        };
    
        // Подписываемся на события
        canvas.on('selection:created', handleSelection);
        canvas.on('selection:cleared', handleDeselection);
    
        // Отписываемся от событий при размонтировании
        return () => {
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:cleared', handleDeselection);
        };
    }, []);

    const saveDesign = () => {
        if (canvasRef.current) {
            const overlayImage = canvasRef.current?.overlayImage;
            const dataURL = canvasRef.current.toDataURL({
                format: 'png',
                quality: 1.0,
                top: overlayImage ? overlayImage.top : 0,
                left: overlayImage ? overlayImage.left : 0,
                width: overlayImage ? overlayImage.width : canvasRef.current.width,
                height: overlayImage ? overlayImage.height : canvasRef.current.height
            });

            const link = document.createElement('a');
            link.download = 'design.png';
            link.href = dataURL;
            link.click();
        }
    };

    const moveLayer = (index: number, direction: number) => {
        let hasMovedOnce = false;
        setLayers((prevLayers) => {
            const newLayers = [...prevLayers];
            const targetIndex = index + direction;
    
            if (targetIndex >= 0 && targetIndex < newLayers.length) {
                // Меняем местами слои
                [newLayers[index], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[index]];
    
                // Обновляем порядок объектов на канвасе
                const canvas = canvasRef.current;
                if (canvas && !hasMovedOnce) {
                    const objects = canvas.getObjects().filter((obj) => obj.type === 'image' || obj.type === 'text');
                    const currentObject = objects[index];
    
                    if (currentObject) {
                        if (direction > 0) {
                            canvas.bringForward(currentObject);
                        } else {
                            canvas.sendBackwards(currentObject);
                        }
                    }
                    canvas.renderAll();
    
                    // Обновляем массив объектов в ref
                    objectsRef.current = canvas.getObjects().filter((obj) => obj.type === 'image' || obj.type === 'text');
                    hasMovedOnce = true;
                }
    
                return newLayers;
            }
            return prevLayers;
        });
    };
    
    return (
        <div style={{ display: 'flex', justifyContent:'space-between' }}>
            <div style={{ width: '200px', marginRight: '20px' }}>
                <h3>Layers</h3>
                {layers.slice().reverse().map((layer) => (
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
                                (<Image src={layer.url as string} alt="layer thumbnail" width={50} height={50} style={{ objectFit: 'cover' }}/>) 
                             :(<span>{`Text: "${layer.text}"`}</span>)
                        }
                        <div>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(layers.indexOf(layer), 1);
                            }}>
                                Up
                            </button>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(layers.indexOf(layer), -1);
                            }}>
                                Down
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div>
                <canvas id="canvas" style={{border: '1px solid black'}}></canvas>
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

export default DesignProduct;
