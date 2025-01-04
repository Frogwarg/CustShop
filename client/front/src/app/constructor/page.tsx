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
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const [canvasSize, setCanvasSize] = useState(() => {
        if (typeof window !== 'undefined') {
            return { width: window.innerWidth * 0.8, height: window.innerHeight };
        }
        return { width: 800, height: 600 };
    });
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const objectsRef = useRef<fabric.Object[]>([]);

    useEffect(() => {
        if (!canvasContainerRef.current) return;

        const canvasElement = document.createElement('canvas');
        canvasContainerRef.current.appendChild(canvasElement);

        const canvas = new fabric.Canvas(canvasElement, {
            width: canvasSize.width,
            height: canvasSize.height,
        });
        canvasRef.current = canvas;

        // Добавление overlayImage
        fabric.Image.fromURL('/products/shirt-mask.png', (overlayImg) => {
            canvas.setOverlayImage(overlayImg, canvas.renderAll.bind(canvas), {
                left: (canvasSize.width - overlayImg.width!) / 2,
                top: (canvasSize.height - overlayImg.height!) / 2,
            });
        });

        return () => {
            canvas.dispose();
            canvasRef.current = null;
        };
    }, [canvasSize]);

    // Обновление размеров канваса
    useEffect(() => {
        const handleResize = () => {
            const newWidth = window.innerWidth * 0.8;
            const newHeight = window.innerHeight * 0.8;

            if (canvasRef.current) {
                const canvas = canvasRef.current;

                const scaleX = newWidth / canvas.width!;
                const scaleY = newHeight / canvas.height!;

                canvas.setDimensions({ width: newWidth, height: newHeight });

                canvas.getObjects().forEach((obj) => {
                    obj.scaleX = (obj.scaleX ?? 1) * scaleX;
                    obj.scaleY = (obj.scaleY ?? 1) * scaleY;
                    obj.left = (obj.left ?? 0) * scaleX;
                    obj.top = (obj.top ?? 0) * scaleY;
                    obj.setCoords();
                });

                canvas.renderAll();
            }

            setCanvasSize({ width: newWidth, height: newHeight });
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const updateCanvasSize = () => {
                setCanvasSize({ width: window.innerWidth * 0.8, height: window.innerHeight });
            };

            updateCanvasSize(); // Установить размер при монтировании
            window.addEventListener('resize', updateCanvasSize);

            return () => {
                window.removeEventListener('resize', updateCanvasSize);
            };
        }
    }, []);

    useEffect(() => {
        const canvas = new fabric.Canvas('canvas', {
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: backgroundColor,
        });
        canvasRef.current = canvas;
    
        // Создаем группу после загрузки overlay
        fabric.Image.fromURL('/products/shirt-mask.png', (overlayImg) => {
            // Позиционируем overlay
            canvas.setOverlayImage(overlayImg, canvas.renderAll.bind(canvas), {
                left: overlayImg.width ? (canvasSize.width - overlayImg.width) / 2 : 0,
                top: overlayImg.height ? (canvasSize.height - overlayImg.height) / 2 : 0,
            });
    
            // Создаем группу с правильными координатами
            const imageGroup = new fabric.Group([], {
                left: overlayImg.width ? (canvasSize.width - overlayImg.width) / 2 : 0,
                top: overlayImg.height ? (canvasSize.height - overlayImg.height) / 2 : 0,
                selectable: true,   
                subTargetCheck: true,
                evented: true,      
                // lockMovementX: true, 
                // lockMovementY: true 
            });
    
            // Создаем clipPath с правильными размерами
            imageGroup.clipPath = new fabric.Rect({
                left: overlayImg.width ? (canvasSize.width - overlayImg.width) / 2 : 0,
                top: overlayImg.height ? (canvasSize.height - overlayImg.height) / 2 : 0,
                width: overlayImg.width,
                height: overlayImg.height,
                absolutePositioned: true
            });
    
            canvas.add(imageGroup);
            // setImageGroup(imageGroup);
        });
        canvas.on('mouse:down', (e) => {
            if (!e.target) {
              setSelectedLayerId(null);
              canvas.discardActiveObject().renderAll();
            }
          });

        return () => {
            canvas.dispose();
        };
    }, [canvasSize, backgroundColor]);
    
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
                    hasControls: true
                });
                const overlayImg = canvasRef.current?.overlayImage;
                if (overlayImg) {
                    fabricImage.clipPath = new fabric.Rect({
                        left: overlayImg.width ? (canvasSize.width - overlayImg.width) / 2 : 0,
                        top: overlayImg.height ? (canvasSize.height - overlayImg.height) / 2 : 0,
                        width: overlayImg.width,
                        height: overlayImg.height,
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
        if (overlayImg) {
            text.clipPath = new fabric.Rect({
                left: overlayImg.width ? (canvasSize.width - overlayImg.width) / 2 : 0,
                top: overlayImg.height ? (canvasSize.height - overlayImg.height) / 2 : 0,
                width: overlayImg.width,
                height: overlayImg.height,
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

    const getAllObjects = () =>{
        console.log(canvasRef.current?.getObjects());
    }

    const handleSelectLayer = (layerId: number | string) => {
        setSelectedLayerId(layerId);
    };

    const saveDesign = () => {
        if (canvasRef.current) {
            const dataURL = canvasRef.current.toDataURL({
                format: 'png',
                quality: 1.0
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
                <button onClick={getAllObjects}>Get All Objects</button>
            </div>
        </div>
    );
};

export default DesignProduct;
