"use client"
import { fabric } from 'fabric';
import { toast } from 'sonner'
import CryptoJS from 'crypto-js';

import { useSearchParams } from 'next/navigation';
//import Image from 'next/image';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import useLayers from './Layers/useLayers';
import authService from '../services/authService';
import { saveStateToIndexedDB, getStateFromIndexedDB, clearStateFromIndexedDB } from '@/app/utils/db';

import ProductModal from './ProductModal/productModal';
import TabbedControls from './tabbedControl';
import LayersPanel from './Layers/LayersPanel';
//import { dataURLtoBlob } from '@/app/utils/lib';

const DesignProduct = () => {
    const searchParams = useSearchParams();
    const designId = searchParams.get('designId');
    
    const [selectedProduct, setSelectedProduct] = useState<{id: string; type: string} | null>(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [currentText, setCurrentText] = useState('Your Text Here');
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
    const [canvasSize, setCanvasSize] = useState(() => {
        if (typeof window !== 'undefined') {
            return { width: window.innerWidth * 0.8, height: window.innerHeight };
        }
        return { width: 800, height: 600 };
    });
    const canvasRef = useRef<fabric.Canvas | null>(null);
    const objectsRef = useRef<fabric.Object[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const {
        layers,
        selectedLayerId,
        addLayer,
        moveLayer,
        removeLayer,
        toggleLayerVisibility,
        setSelectedLayerId,
        setLayers
    } = useLayers(canvasRef);

    useEffect(() => {
        const initializeCanvasAndLayers = async () => {
            // const savedState = localStorage.getItem('designState');
            const savedState = await getStateFromIndexedDB();
            if (!canvasRef.current) {
                const canvas = new fabric.Canvas('canvas', {
                    width: canvasSize.width,
                    height: canvasSize.height,
                    backgroundColor: backgroundColor,
                    selection: false,
                    controlsAboveOverlay: true,
                });
                canvasRef.current = canvas;
    
                // Инициализация overlayImage
                await new Promise<void>((resolve) => {
                    fabric.Image.fromURL('/products/shirt-mask.png', (overlayImg) => {
                        overlayImg.set({
                            selectable: false,
                            evented: false,
                            hasControls: false,
                            hasBorders: false,
                            lockMovementX: true,
                            lockMovementY: true,
                        });
                        canvas.setOverlayImage(overlayImg, canvas.renderAll.bind(canvas), {
                            left: (canvasSize.width - overlayImg.width!) / 2,
                            top: (canvasSize.height - overlayImg.height!) / 2,
                        });
                        resolve();
                    }, { crossOrigin: 'anonymous' });
                });
            }
    
            if (!savedState) return;
    
            const {
                selectedProduct: savedProduct,
                layers: savedLayers,
                selectedLayerId: savedLayerId,
                currentText: savedText,
                canvasSize: savedSize,
            } = JSON.parse(savedState);
    
            // Устанавливаем состояния
            setSelectedProduct(savedProduct);
            setSelectedLayerId(savedLayerId);
            setCurrentText(savedText);
            setCanvasSize(savedSize);
    
            // Восстанавливаем продукт, если он был выбран
            if (savedProduct) {
                await new Promise<void>((resolve) => {
                    handleProductSelect(savedProduct.id, savedProduct.type);
                    setTimeout(() => resolve(), 500); // Даем время на загрузку overlayImage
                });
            }

            const canvas = canvasRef.current!;
            // canvas.getObjects().forEach((obj) => {
            //     if (obj !== canvas.overlayImage) canvas.remove(obj);
            // });
            // Восстанавливаем слои
            for (const layer of savedLayers) {
                if (layer.type === 'image' && typeof layer.url === 'string') {
                    // Создаем изображение напрямую из Data URL
                    const img = new window.Image();
                    img.src = layer.url; // Используем Data URL напрямую
                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                            const fabricImage = new fabric.Image(img, {
                                left: layer.x,
                                top: layer.y,
                                scaleX: layer.width / img.width,
                                scaleY: layer.height / img.height,
                                data: { id: layer.id },
                                visible: layer.visible
                            });
                            
    
                            // Применяем clipPath, если есть overlay
                            const overlayImg = canvas.overlayImage;
                            if (overlayImg) {
                                const overlayLeft = (canvasSize.width - overlayImg.width!) / 2;
                                const overlayTop = (canvasSize.height - overlayImg.height!) / 2;
                                fabricImage.clipPath = new fabric.Rect({
                                    left: overlayLeft + 1,
                                    top: overlayTop + 1,
                                    width: overlayImg.width! - 3,
                                    height: overlayImg.height! - 3,
                                    absolutePositioned: true,
                                    visible: layer.visible
                                });
                            }
                            canvas.add(fabricImage);
                            fabricImage.setCoords();      
                            addLayer(layer);
                            resolve();
                        };
                        img.onerror = () => {
                            console.error(`Ошибка загрузки изображения: ${layer.url}`);
                            resolve(); // Продолжаем даже в случае ошибки
                        };
                    });
                } else if (layer.type === 'text' && layer.text) {
                    const text = new fabric.Text(layer.text, {
                        left: layer.x,
                        top: layer.y,
                        scaleX: layer.scaleX || 1,
                        scaleY: layer.scaleY || 1,
                        fontSize: layer.fontSize || 30,
                        data: { id: layer.id },
                        visible: layer.visible
                    });
    
                    // Применяем clipPath для текста
                    const overlayImg = canvas.overlayImage;
                    if (overlayImg) {
                        const overlayLeft = (canvasSize.width - overlayImg.width!) / 2;
                        const overlayTop = (canvasSize.height - overlayImg.height!) / 2;
                        text.clipPath = new fabric.Rect({
                            left: overlayLeft + 1,
                            top: overlayTop + 1,
                            width: overlayImg.width! - 3,
                            height: overlayImg.height! - 3,
                            absolutePositioned: true,
                            visible: layer.visible
                        });
                    }
    
                    canvas.add(text);
                    text.setCoords(); // Обновляем координаты
                    addLayer(layer);
                }
            }
            canvas.on('mouse:down', (e) => {
                if (!e.target) {
                    setSelectedLayerId(null);
                    canvas.discardActiveObject().renderAll();
                }
            });
    
            canvas.renderAll();
        };
    
        initializeCanvasAndLayers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const saveStateToLocalStorage = useCallback(async () => {
        const state = {
            selectedProduct,
            layers,
            selectedLayerId,
            currentText,
            canvasSize
        };
        await saveStateToIndexedDB(JSON.stringify(state));
        // localStorage.setItem('designState', JSON.stringify(state));
    }, [selectedProduct, layers, selectedLayerId, currentText, canvasSize]);
    
    useEffect(() => {
        saveStateToLocalStorage();
    }, [saveStateToLocalStorage]);

    const handleProductSelect = (productId: string, productType: string) => {
        setSelectedProduct({ id: productId, type: productType });
        setIsProductModalOpen(false);
    
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.overlayImage = undefined;
            canvas.backgroundImage = undefined;

            canvas.getObjects().forEach((obj) => {
                if (
                    (obj.type === 'rect' && obj.strokeDashArray) || // Удаление рамки
                    obj === canvas.overlayImage                  // Удаление старого overlayImage
                ) {
                    canvas.remove(obj);
                }
            });
    
            fabric.Image.fromURL(`/products/${productId}-mask.png`, (image) => {
                if (productType === '3D') {
                    // Установка overlayImage
                    canvas.setOverlayImage(image, canvas.renderAll.bind(canvas), {
                        left: (canvas.width! - image.width!) / 2,
                        top: (canvas.height! - image.height!) / 2,
                    });
    
                    // Обновление clipPath для слоёв
                    const overlayLeft = (canvas.width! - image.width!) / 2;
                    const overlayTop = (canvas.height! - image.height!) / 2;
    
                    canvas.getObjects().forEach((obj) => {
                        if (obj !== canvas.overlayImage) {
                            obj.clipPath = new fabric.Rect({
                                left: overlayLeft + 1,
                                top: overlayTop + 1,
                                width: image.width! - 3,
                                height: image.height! - 3,
                                absolutePositioned: true,
                            });
                            obj.setCoords();
                        }
                    });
                } else if (productType === 'regular') {
                    // Установка backgroundImage
                    canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas), {
                        left: (canvas.width! - image.width!) / 2,
                        top: (canvas.height! - image.height!) / 2,
                        originX: 'left',
                        originY: 'top',
                    });
    
                    // Добавление прозрачного rect с dotted stroke
                    const rectArea = new fabric.Rect({
                        left: (canvas.width! - image.width!) / 2,
                        top: (canvas.height! - image.height!) / 2,
                        width: image.width!,
                        height: image.height!,
                        stroke: 'black',
                        strokeDashArray: [5, 5],
                        fill: 'transparent',
                        selectable: false,
                        evented: false,
                    });
                    canvas.add(rectArea);
    
                    // Обновление clipPath для слоёв
                    const rectLeft = rectArea.left!;
                    const rectTop = rectArea.top!;
    
                    canvas.getObjects().forEach((obj) => {
                        if (obj !== rectArea) {
                            obj.clipPath = new fabric.Rect({
                                left: rectLeft,
                                top: rectTop,
                                width: rectArea.width,
                                height: rectArea.height,
                                absolutePositioned: true,
                            });
                            obj.setCoords();
                        }
                    });
                }
    
                canvas.renderAll();
            });
        }
    }
    useEffect(() => {
        const handleResize = () => {
            const newWidth = window.innerWidth * 0.8;
            const newHeight = window.innerHeight;
        
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                let overlayImg = canvas.overlayImage;
                
                if (!overlayImg) {
                    overlayImg = canvas.backgroundImage as fabric.Image;
                    if (!overlayImg) return;
                }
        
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

                setLayers((prevLayers) =>
                    prevLayers.map((layer) => {
                        const obj = canvas.getObjects().find((o) => o.data?.id === layer.id);
                        if (obj) {
                            return {
                                ...layer,
                                x: obj.left || 0,
                                y: obj.top || 0,
                                width: obj.width! * obj.scaleX!,
                                height: obj.height! * obj.scaleY!,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1
                            };
                        }
                        return layer;
                    })
                );
        
                canvas.renderAll();
            }
        
            setCanvasSize({ width: newWidth, height: newHeight });
            saveStateToLocalStorage();
        };
    
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                if (!canvasRef.current) return;

                const aspectRatio = img.width / img.height;
                const newWidth = img.width > canvasSize.width ? canvasSize.width/2 : img.width/2;
                const newHeight = newWidth / aspectRatio;

                const scaleX = newWidth / img.width;
                const scaleY = newHeight / img.height;
                // const newHeight = newWidth / aspectRatio;
                const layerId = 'layer-' + Date.now();
                const fabricImage = new fabric.Image(img, {
                    left: (canvasSize.width - newWidth) / 2,
                    top: (canvasSize.height - newHeight) / 2,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    selectable: true,
                    evented: true,
                    hasBorders: true,
                    hasControls: true,
                    data: { id: layerId }
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

                    overlayImg.set({
                        selectable: false,
                        evented: false,
                        hasControls: false,
                        hasBorders: false,
                        lockMovementX: true,
                        lockMovementY: true
                    });
                }

                canvasRef.current?.add(fabricImage);
                objectsRef.current = canvasRef.current?.getObjects() || [];

                addLayer(
                    { 
                        id: layerId,
                        type: 'image',
                        image: img,
                        x: fabricImage.left || 0,
                        y: fabricImage.top || 0,
                        width: newWidth,
                        height: newHeight,
                        url: reader.result,
                    },
                );
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            };
        };

        reader.readAsDataURL(file);
    };

    const handleAddText = () => {
        if (!currentText.trim()) {
            toast.error('Текст не может быть пустым');
            return;
          }

        const layerId = 'layer-' + Date.now();
        const text = new fabric.Text(currentText, {
            left: canvasSize.width / 2,
            top: canvasSize.height / 2,
            fontSize: 30,
            data: { id: layerId }
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
        addLayer(
            { 
                id: layerId, 
                type: 'text', 
                text: currentText, 
                x: text.left || 0, 
                y: text.top || 0,
                fontSize: 30,
                width: text.width || 200,
                height: text.height || 30
            }
        );
        setCurrentText('');
    };

    const handleSelectLayer = (layerId: number | string) => {
        setSelectedLayerId(layerId);
        const canvas = canvasRef.current;
        if (canvas) {
            const obj = canvas.getObjects().find((o) => o.data?.id === layerId);
            if (obj) {
                canvas.setActiveObject(obj); // Выделяем объект на канвасе
                canvas.renderAll();
            }
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
    
        // Словарь для хранения начальных z-index объектов
        const originalIndices = new Map<fabric.Object, number>();

        const updateLayerPosition = (event: fabric.IEvent) => {
            const target = event.target;
            if (!target || !target.data?.id) return;
    
            const layerId = target.data.id;
            const newX = target.left || 0;
            const newY = target.top || 0;
            const newWidth = target.width! * target.scaleX!;
            const newHeight = target.height! * target.scaleY!;
            const newScaleX = target.scaleX || 1;
            const newScaleY = target.scaleY || 1;
    
            setLayers((prevLayers) =>
                prevLayers.map((layer) =>
                    layer.id === layerId ? {
                        ...layer,
                        x: newX,
                        y: newY,
                        width: newWidth,
                        height: newHeight,
                        scaleX: newScaleX,
                        scaleY: newScaleY,
                    }
                  : layer
                )
            );
        };
    
        const handleSelection = (event: fabric.IEvent) => {
            const target = event.selected ? event.selected[0] : null; // Получаем первый объект из массива selected
            if (target && target.data?.id) {
                // Перемещаем объект на самый верх
                //const originalIndex = canvas.getObjects().indexOf(target);
                const canvasIndex = canvas.getObjects().indexOf(target);
                originalIndices.set(target, canvasIndex);

                // Перемещаем объект наверх
                canvas.bringToFront(target);
                setSelectedObject(target);
                setSelectedLayerId(target.data.id);
                canvas.renderAll();
            }
        };
        
        const restoreLayerOrder = () => {
            const userObjects = canvas
                .getObjects()
                .filter((obj) => obj.data?.id && (obj.type === 'image' || obj.type === 'text'));
            layers.forEach((layer, index) => {
                const obj = userObjects.find((o) => o.data?.id === layer.id);
                if (obj) {
                    const baseIndex = canvas.getObjects().indexOf(userObjects[0]);
                    canvas.moveTo(obj, baseIndex + index);
                }
            });
            canvas.renderAll();
        };

        const handleDeselection = (event: fabric.IEvent) => {
            const deselected = event.deselected; // Массив снятых объектов
            if (deselected && deselected.length > 0) {
                deselected.forEach((target) => {
                    if (originalIndices.has(target)) {
                        // Возвращаем объект на исходный z-index
                        const originalIndex = originalIndices.get(target)!;
                        canvas.remove(target);
                        canvas.insertAt(target, originalIndex, false);
                        originalIndices.delete(target);
                    }
                });

                setSelectedObject(null);
                setSelectedLayerId(null);

                // Синхронизируем layers с порядком на канвасе после возвращения
                restoreLayerOrder();
            }
        };
    
        // Подписываемся на события
        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', handleDeselection);
        canvas.on('object:modified', updateLayerPosition);
    
        // Отписываемся от событий при размонтировании
        return () => {
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:updated', handleSelection);
            canvas.off('selection:cleared', handleDeselection);
            canvas.off('object:modified', updateLayerPosition);
        };
    }, [canvasRef, setLayers, setSelectedLayerId, layers]);

    const saveDesign = async () => {
        if (!canvasRef.current) return;
        
        try {
            // Получаем превью дизайна
            const overlayImage = canvasRef.current?.overlayImage;
            const previewDataURL = canvasRef.current.toDataURL({
                format: 'png',
                quality: 1.0,
                top: overlayImage ? overlayImage.top : 0,
                left: overlayImage ? overlayImage.left : 0,
                width: overlayImage ? overlayImage.width : canvasRef.current.width,
                height: overlayImage ? overlayImage.height : canvasRef.current.height
            });

            // Загружаем превью в ImgBB
            const uploadResponse = await fetch('/api/upload/design-preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: previewDataURL
                })
            });

            if (!uploadResponse.ok) {
                throw new Error('Ошибка при загрузке превью');
            }

            const { imageUrl } = await uploadResponse.json();

            // Подготавливаем данные дизайна
            const designData = {
                canvasSize,
                prodType: selectedProduct,
                layers: layers.map(layer => ({
                    ...layer,
                    url: layer.type === 'image' ? layer.url : undefined
                }))
            };

            const designHash = CryptoJS.SHA256(JSON.stringify(designData)).toString();

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Токен авторизации отсутствует');
            }

            // Сохраняем дизайн в историю
            const designRequest = {
                name: `Дизайн ${new Date().toLocaleString()}`,
                description: 'Пользовательский дизайн',
                previewUrl: imageUrl,
                designData: JSON.stringify(designData),
                designHash: designHash,
                productType: selectedProduct?.id || 'unknown',
            };

            const saveDesignResponse = await authService.fetchWithRefresh('/api/profile/designs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(designRequest),
            });
    
            if (!saveDesignResponse.ok) {
                const errorText = await saveDesignResponse.text();
                throw new Error(`Ошибка сохранения в историю: ${saveDesignResponse.status} - ${errorText}`);
            }

            const savedDesign = await saveDesignResponse.json();
            // Создаем объект для корзины с полученным URL изображения
            const cartItem = {
                design: {
                    id: designId || `design-${new Date().toLocaleString()}`,
                    name: `Дизайн ${new Date().toLocaleString()}`,
                    description: "Пользовательский дизайн",
                    previewUrl: imageUrl, // Используем полученный URL вместо base64
                    designData: designRequest.designData,
                    designHash: designHash,
                    productType: selectedProduct?.id,
                    designType: "Custom"
                },
                quantity: 1,
                price: 1000 // Здесь нужна логика расчета цены
            };

            const endpoint = designId ? `/api/cart/update/${designId}` : '/api/cart/add';
            const method = designId ? 'PUT' : 'POST';
            
            // Добавляем в корзину
            const cartResponse = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cartItem)
            });

            if (cartResponse.ok) {
                toast.success(designId ? 'Дизайн обновлен' : 'Товар добавлен в корзину');
            } else {
                // Получаем текст ошибки с сервера
                const errorText = await cartResponse.text();
                throw new Error(`Ошибка сервера: ${cartResponse.status} - ${errorText}`);
            }
        } catch (error: Error | unknown) {
            console.error('Ошибка:', error);
            toast.error(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const getAllObjects = () =>{
        console.log('Canvas Objects:', canvasRef.current?.getObjects());
        console.log('Layers:', layers);
    }

    const resetDesign = async () => {
        if (canvasRef.current) {
          canvasRef.current.clear();
          canvasRef.current.backgroundColor = backgroundColor;
          fabric.Image.fromURL('/products/shirt-mask.png', (overlayImg) => {
            overlayImg.set({
              selectable: false,
              evented: false,
              hasControls: false,
              hasBorders: false,
              lockMovementX: true,
              lockMovementY: true,
            });
            canvasRef.current?.setOverlayImage(overlayImg, canvasRef.current.renderAll.bind(canvasRef.current), {
              left: (canvasSize.width - overlayImg.width!) / 2,
              top: (canvasSize.height - overlayImg.height!) / 2,
            });
            setBackgroundColor(backgroundColor);

          });
        }
        setSelectedProduct(null);
        setSelectedLayerId(null);
        setCurrentText('Your Text Here');
        layers.forEach((layer) => removeLayer(layer.id));
        await clearStateFromIndexedDB();
        // localStorage.removeItem('designState');

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent:'space-between' }}>
        
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSelectProduct={handleProductSelect}
            />

            <LayersPanel
                layers={layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={handleSelectLayer}
                onMoveLayer={moveLayer}
                onRemoveLayer={removeLayer}
                onToggleVisibility={toggleLayerVisibility}
            />

            <div>
                <canvas id="canvas" style={{border: '1px solid black'}}></canvas>
            </div>

            <div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} />
                <input
                    type="text"
                    value={currentText}
                    onChange={(e) => setCurrentText (e.target.value)}
                    placeholder="Enter text"
                />
                <button onClick={handleAddText}>Add Text</button>
                <button onClick={() => setIsProductModalOpen(true)}>Выбрать товар</button>
                <button onClick={getAllObjects}>Get All Objects</button>
                <button onClick={saveDesign}>Save Design</button>
                <button onClick={resetDesign}>Reset Design</button>
                <TabbedControls  selectedObject={selectedObject} 
                    onUpdateObject={(updatedProperties) => {
                        if (selectedObject) {
                            selectedObject.set(updatedProperties);
                            selectedObject.canvas?.renderAll();
                        }
                }} />
            </div>
        </div>
    );
};

export default DesignProduct;