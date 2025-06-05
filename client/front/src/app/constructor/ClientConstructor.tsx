"use client"
import { fabric } from 'fabric';
import { toast } from 'sonner'
import CryptoJS from 'crypto-js';
import axios from 'axios';

import { useSearchParams, useRouter } from 'next/navigation';
import authService from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import useLayers, { Layer } from './Layers/useLayers';
import { SerializedFabricFilter } from './Layers/useLayers';
import { saveStateToIndexedDB, getStateFromIndexedDB, clearStateFromIndexedDB } from '@/app/utils/db';
import { createFilterByName } from '../utils/lib';
import {products} from './ProductModal/productModal';

import styles from './constructor.module.css';

import ProductModal from './ProductModal/productModal';
import TabbedControls from './tabbedControl';
import LayersPanel from './Layers/LayersPanel';
import CatalogAddModal from './CatalogAddModal/CatalogAddModal';

export default function ClientConstructor() {
    const searchParams = useSearchParams();
    const designId = searchParams.get('designId');

    const { isAuthenticated, hasRole } = useAuth();
    const [canShowCatalogButton, setCanShowCatalogButton] = useState(false);

    useEffect(() => {
        setCanShowCatalogButton(hasRole('Moderator') || hasRole('Admin'));
    }, [hasRole]);

    const [isCanvasLoading, setIsCanvasLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [designAuthorId, setDesignAuthorId] = useState<string | null>(null);

    const [selectedProduct, setSelectedProduct] = useState<{id: string; type: string}>({id:"shirt", type:"3D"});
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
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
    const hasInitialized = useRef(false);
    const router = useRouter();

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
        try {
            const initializeCanvasAndLayers = async () => {
                if (hasInitialized.current) return;
                hasInitialized.current = true;
                let savedState: string | null = null;
                let remoteState: { designData?: string; productType?: string } = {};
                setLayers([]);

                if (designId){
                    try {
                        const remoteDesign = await authService.axiosWithRefresh<{ designData?: string; userId?: string }>('get', `/Design/${designId}`);
                        if (remoteDesign && remoteDesign.designData) {
                            remoteState = remoteDesign;
                            savedState = remoteDesign.designData;
                            setDesignAuthorId(remoteDesign.userId || null);
                        } else {
                            console.warn('No design data found for designId:', designId);
                        }
                    } catch (error) {
                        console.error('Failed to fetch design from remote:', error);
                        toast.error('Failed to load design from server. Loading local state.');
                    }
                } 
                if (!savedState) {
                    savedState = await getStateFromIndexedDB();
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
                const restoredProduct = savedProduct ?? (
                    remoteState ? 
                        {id: remoteState.productType, type: products.find(p => p.id === remoteState.productType)?.type || 'regular'} : 
                        {id: 'shirt', type: '3D'}
                );

                setSelectedProduct(restoredProduct);
                setSelectedLayerId(savedLayerId);
                setCurrentText(savedText ?? 'Your Text Here');
                setCanvasSize(savedSize);

                if (!canvasRef.current) {
                    const canvas = new fabric.Canvas('canvas', {
                        width: savedSize.width,
                        height: savedSize.height,
                        backgroundColor: backgroundColor,
                        selection: false,
                        controlsAboveOverlay: true,
                    });
                    canvasRef.current = canvas;
                }


                await new Promise<void>((resolve) => {
                    handleProductSelect(restoredProduct.id, restoredProduct.type);
                    setTimeout(() => resolve(), 500); // Даем время на загрузку маски
                });

                const canvas = canvasRef.current!;

                for (const layer of savedLayers) {
                    if (layer.type === 'image' && typeof layer.url === 'string') {
                        const img = new window.Image();
                        img.src = layer.url;
                        await new Promise<void>((resolve) => {
                            img.onload = () => {
                                const fabricImage = new fabric.Image(img, {
                                    left: layer.x,
                                    top: layer.y,
                                    scaleX: layer.width / img.width,
                                    scaleY: layer.height / img.height,
                                    flipX: layer.flipX,
                                    flipY: layer.flipY,
                                    angle: layer.angle || 0,
                                    data: { id: layer.id },
                                    visible: layer.visible
                                });

                                // Применяем фильтры
                                if (Array.isArray(layer.filters)) {
                                    const fabricFilters: fabric.IBaseFilter[] = layer.filters.map((f: SerializedFabricFilter) => {
                                        const filterMap: { [key: string]: new (options?: unknown) => fabric.IBaseFilter } = {
                                            Grayscale: fabric.Image.filters.Grayscale as unknown as new (options?: unknown) => fabric.IBaseFilter,
                                            Sepia: fabric.Image.filters.Sepia as unknown as new (options?: unknown) => fabric.IBaseFilter,
                                            Invert: fabric.Image.filters.Invert as unknown as new (options?: unknown) => fabric.IBaseFilter,
                                            Brightness: fabric.Image.filters.Brightness as unknown as new (options?: unknown) => fabric.IBaseFilter
                                        };
                                        const FilterClass = filterMap[f.name];
                                        if (!FilterClass) return null;
                                        return new FilterClass(f.options);
                                    }).filter(Boolean) as fabric.IBaseFilter[];

                                    fabricImage.filters = fabricFilters;
                                    fabricImage.applyFilters();
                                }

                                // Применяем clipPath
                                const product = products.find(p => p.id === restoredProduct.id);
                                if (product?.type === '3D' && canvas.overlayImage) {
                                    const overlayLeft = (canvas.width! - canvas.overlayImage.width!) / 2;
                                    const overlayTop = (canvas.height! - canvas.overlayImage.height!) / 2;
                                    fabricImage.clipPath = new fabric.Rect({
                                        left: overlayLeft + 1,
                                        top: overlayTop + 1,
                                        width: canvas.overlayImage.width! - 3,
                                        height: canvas.overlayImage.height! - 3,
                                        absolutePositioned: true,
                                        visible: layer.visible
                                    });
                                } else if (product?.type === 'regular' && product.clipArea && canvas.backgroundImage) {
                                    const bgImg = canvas.backgroundImage as fabric.Image;
                                    const bgLeft = bgImg.left || 0;
                                    const bgTop = bgImg.top || 0;
                                    const clipWidth = bgImg.width! * product.clipArea.width;
                                    const clipHeight = bgImg.height! * product.clipArea.height;
                                    const clipLeft = bgLeft + (bgImg.width! * product.clipArea.x);
                                    const clipTop = bgTop + (bgImg.height! * product.clipArea.y);
                                    fabricImage.clipPath = new fabric.Rect({
                                        left: clipLeft,
                                        top: clipTop,
                                        width: clipWidth,
                                        height: clipHeight,
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
                                resolve(); // Продолжаем даже в случае ошибки
                            };
                        });
                    } else if (layer.type === 'text' && layer.text) {
                        const text = new fabric.Text(layer.text, {
                            left: layer.x,
                            top: layer.y,
                            scaleX: layer.scaleX || 1,
                            scaleY: layer.scaleY || 1,
                            flipX: layer.flipX,
                            flipY: layer.flipY,
                            angle: layer.angle || 0,
                            fontSize: layer.fontSize || 30,
                            data: { id: layer.id },
                            visible: layer.visible,
                            fill: layer.fill,
                            fontFamily: layer.fontFamily
                        });

                        const product = products.find(p => p.id === restoredProduct.id);
                        if (product?.type === '3D' && canvas.overlayImage) {
                            const overlayLeft = (canvas.width! - canvas.overlayImage.width!) / 2;
                            const overlayTop = (canvas.height! - canvas.overlayImage.height!) / 2;
                            text.clipPath = new fabric.Rect({
                                left: overlayLeft + 1,
                                top: overlayTop + 1,
                                width: canvas.overlayImage.width! - 3,
                                height: canvas.overlayImage.height! - 3,
                                absolutePositioned: true,
                                visible: layer.visible
                            });
                        } else if (product?.type === 'regular' && product.clipArea && canvas.backgroundImage) {
                            const bgImg = canvas.backgroundImage as fabric.Image;
                            const bgLeft = bgImg.left || 0;
                            const bgTop = bgImg.top || 0;
                            const clipWidth = bgImg.width! * product.clipArea.width;
                            const clipHeight = bgImg.height! * product.clipArea.height;
                            const clipLeft = bgLeft + (bgImg.width! * product.clipArea.x);
                            const clipTop = bgTop + (bgImg.height! * product.clipArea.y);
                            text.clipPath = new fabric.Rect({
                                left: clipLeft,
                                top: clipTop,
                                width: clipWidth,
                                height: clipHeight,
                                absolutePositioned: true,
                                visible: layer.visible
                            });
                        }

                        canvas.add(text);
                        text.setCoords();
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
        } catch (error) {
            console.error("Ошибка: ", error);
        } finally {
            setIsCanvasLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [designId]);

    
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

            const product = products.find(p => p.id === productId);
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
                } else if (productType === 'regular' && product?.clipArea) {
                    // Установка backgroundImage
                    canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas), {
                        left: (canvas.width! - image.width!) / 2,
                        top: (canvas.height! - image.height!) / 2,
                        originX: 'left',
                        originY: 'top',
                    });
    
                    // Добавление прозрачного rect с dotted stroke
                    const bgLeft = (canvas.width! - image.width!) / 2;
                    const bgTop = (canvas.height! - image.height!) / 2;
                    const clipWidth = image.width! * product.clipArea.width;
                    const clipHeight = image.height! * product.clipArea.height;
                    const clipLeft = bgLeft + (image.width! * product.clipArea.x);
                    const clipTop = bgTop + (image.height! * product.clipArea.y);
    
                    const rectArea = new fabric.Rect({
                        left: clipLeft,
                        top: clipTop,
                        width: clipWidth,
                        height: clipHeight,
                        stroke: 'black',
                        strokeDashArray: [5, 5],
                        fill: 'transparent',
                        selectable: false,
                        evented: false,
                    });
                    canvas.add(rectArea);
    
                    canvas.getObjects().forEach((obj) => {
                        if (obj !== rectArea) {
                            obj.clipPath = new fabric.Rect({
                                left: clipLeft,
                                top: clipTop,
                                width: clipWidth,
                                height: clipHeight,
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
                const overlayImg = canvas.overlayImage;
                const bgImg = canvas.backgroundImage as fabric.Image;
                const product = products.find(p => p.id === selectedProduct.id);
                
                canvas.setDimensions({ width: newWidth, height: newHeight });
        
                if (product?.type === '3D' && overlayImg) {
                    const oldOverlayLeft = overlayImg.left || (canvasSize.width - overlayImg.width!) / 2;
                    const oldOverlayTop = overlayImg.top || (canvasSize.height - overlayImg.height!) / 2;
                    
                    // Обновляем положение overlayImage
                    const newOverlayLeft = (newWidth - overlayImg.width!) / 2;
                    const newOverlayTop = (newHeight - overlayImg.height!) / 2;
                    overlayImg.set({
                        strokeWidth: 0,
                        stroke: undefined,
                        left: newOverlayLeft,
                        top: newOverlayTop
                    });
        
                    // Обновляем позиции объектов
                    canvas.getObjects().forEach(obj => {
                        if (obj === overlayImg) return;
        
                        // Вычисляем относительную позицию объекта внутри области overlayImage
                        const relativeX = (obj.left! - oldOverlayLeft) / (overlayImg.width! || 1);
                        const relativeY = (obj.top! - oldOverlayTop) / (overlayImg.height! || 1);
        
                        // Устанавливаем новую позицию
                        obj.set({
                            left: newOverlayLeft + (relativeX * overlayImg.width!),
                            top: newOverlayTop + (relativeY * overlayImg.height!)
                        });
        
                        // Обновляем clipPath
                        obj.clipPath = new fabric.Rect({
                            left: newOverlayLeft + 1,
                            top: newOverlayTop + 1,
                            width: overlayImg.width! - 3,
                            height: overlayImg.height! - 3,
                            absolutePositioned: true
                        });
        
                        obj.setCoords();
                    });
                } else if (product?.type === 'regular' && product?.clipArea && bgImg) {
                    bgImg.set({
                        left: (newWidth - bgImg.width!) / 2,
                        top: (newHeight - bgImg.height!) / 2
                    });
        
                    const bgLeft = (newWidth - bgImg.width!) / 2;
                    const bgTop = (newHeight - bgImg.height!) / 2;
                    const clipWidth = bgImg.width! * product.clipArea.width;
                    const clipHeight = bgImg.height! * product.clipArea.height;
                    const clipLeft = bgLeft + (bgImg.width! * product.clipArea.x);
                    const clipTop = bgTop + (bgImg.height! * product.clipArea.y);
        
                    const rectArea = canvas.getObjects().find(obj => obj.type === 'rect' && obj.strokeDashArray);
                    if (rectArea) {
                        rectArea.set({
                            left: clipLeft,
                            top: clipTop,
                            width: clipWidth,
                            height: clipHeight
                        });
                    }
        
                    canvas.getObjects().forEach(obj => {
                        if (obj === rectArea || obj === bgImg) return;
        
                        if (product.clipArea) {
                            const relativeX = (obj.left! - ((canvasSize.width - bgImg.width!) / 2 + (bgImg.width! * product.clipArea.x))) / (bgImg.width! * product.clipArea.width);
                            const relativeY = (obj.top! - ((canvasSize.height - bgImg.height!) / 2 + (bgImg.height! * product.clipArea.y))) / (bgImg.height! * product.clipArea.height);

                            obj.set({
                                left: clipLeft + (relativeX * clipWidth),
                                top: clipTop + (relativeY * clipHeight)
                            });

                            obj.clipPath = new fabric.Rect({
                                left: clipLeft,
                                top: clipTop,
                                width: clipWidth,
                                height: clipHeight,
                                absolutePositioned: true
                            });

                            obj.setCoords();
                        }
                    });
                }

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

        const maxSizeInBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            toast.error('Файл слишком большой. Максимальный размер: 5 МБ.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

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
                const product = products.find(p => p.id === selectedProduct.id);
                if (product?.type === '3D' && canvasRef.current?.overlayImage) {
                    const overlayImg = canvasRef.current.overlayImage;
                    const overlayLeft = (canvasSize.width - overlayImg.width!) / 2;
                    const overlayTop = (canvasSize.height - overlayImg.height!) / 2;
                    fabricImage.clipPath = new fabric.Rect({
                        left: overlayLeft + 1,
                        top: overlayTop + 1,
                        width: overlayImg.width! - 3,
                        height: overlayImg.height! - 3,
                        absolutePositioned: true
                    });
                } else if (product?.type === 'regular' && product.clipArea && canvasRef.current?.backgroundImage) {
                    const bgImg = canvasRef.current.backgroundImage as fabric.Image;
                    const bgLeft = bgImg.left || 0;
                    const bgTop = bgImg.top || 0;
                    const clipWidth = bgImg.width! * product.clipArea.width;
                    const clipHeight = bgImg.height! * product.clipArea.height;
                    const clipLeft = bgLeft + (bgImg.width! * product.clipArea.x);
                    const clipTop = bgTop + (bgImg.height! * product.clipArea.y);
                    fabricImage.clipPath = new fabric.Rect({
                        left: clipLeft,
                        top: clipTop,
                        width: clipWidth,
                        height: clipHeight,
                        absolutePositioned: true
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
                        flipX: false,
                        flipY: false,
                        angle: 0,
                        width: newWidth,
                        height: newHeight,
                        url: reader.result,
                        filters: undefined,
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
        const product = products.find(p => p.id === selectedProduct.id);
        if (product?.type === '3D' && canvasRef.current?.overlayImage) {
            const overlayImg = canvasRef.current.overlayImage;
            const overlayLeft = (canvasSize.width - overlayImg.width!) / 2;
            const overlayTop = (canvasSize.height - overlayImg.height!) / 2;
            text.clipPath = new fabric.Rect({
                left: overlayLeft + 1,
                top: overlayTop + 1,
                width: overlayImg.width! - 3,
                height: overlayImg.height! - 3,
                absolutePositioned: true
            });
        } else if (product?.type === 'regular' && product.clipArea && canvasRef.current?.backgroundImage) {
            const bgImg = canvasRef.current.backgroundImage as fabric.Image;
            const bgLeft = bgImg.left || 0;
            const bgTop = bgImg.top || 0;
            const clipWidth = bgImg.width! * product.clipArea.width;
            const clipHeight = bgImg.height! * product.clipArea.height;
            const clipLeft = bgLeft + (bgImg.width! * product.clipArea.x);
            const clipTop = bgTop + (bgImg.height! * product.clipArea.y);
            text.clipPath = new fabric.Rect({
                left: clipLeft,
                top: clipTop,
                width: clipWidth,
                height: clipHeight,
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
                flipX: false,
                flipY: false,
                angle: 0,
                fontSize: 30,
                width: text.width || 200,
                height: text.height || 30,
                fill: '#000',
                fontFamily: 'Times New Roman'
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
                canvas.setActiveObject(obj);
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
            const newAngle = target.angle || 0;
    
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
                        angle: newAngle,
                    }
                  : layer
                )
            );
        };
    
        const handleSelection = (event: fabric.IEvent) => {
            const target = event.selected ? event.selected[0] : null;
            if (target && target.data?.id) {
                // Перемещаем объект на самый верх
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

    function generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }

    const canUpdateDesign = () => {
        if (!isAuthenticated || !designId || !designAuthorId) return false;
        const userId = authService.getUserId();
        return hasRole('Admin') || hasRole('Moderator') || userId === designAuthorId;
    };

    const saveDesign = async (updateExisting: boolean = false) => {
        setIsSaving(true);
        if (!canvasRef.current) return;
        
        try {
            let dashedRect: fabric.Object | undefined;
            if (selectedProduct.type === 'regular') {
                dashedRect = canvasRef.current.getObjects().find(obj => obj.type === 'rect' && obj.strokeDashArray);
                if (dashedRect) {
                    dashedRect.set({ visible: false });
                    canvasRef.current.renderAll();
                }
            }

            // Получаем превью дизайна
            let overlayImage = canvasRef.current?.overlayImage;
            if (!overlayImage)
                overlayImage = canvasRef.current?.backgroundImage as fabric.Image | undefined;
            console.log(overlayImage);
            console.log({
                top: overlayImage ? overlayImage.top : 0,
                left: overlayImage ? overlayImage.left : 0,
                width: overlayImage ? overlayImage.width : canvasRef.current.width,
                height: overlayImage ? overlayImage.height : canvasRef.current.height
            });
            const previewDataURL = canvasRef.current.toDataURL({
                format: 'png',
                quality: 1.0,
                top: overlayImage ? overlayImage.top : 0,
                left: overlayImage ? overlayImage.left : 0,
                width: overlayImage ? overlayImage.width : canvasRef.current.width,
                height: overlayImage ? overlayImage.height : canvasRef.current.height
            });

            if (dashedRect) {
                dashedRect.set({ visible: true });
                canvasRef.current.renderAll();
            }

            // Загружаем превью в ImgBB
            const { imageUrl } = await authService.axiosWithRefresh<{ imageUrl: string }>('post', '/upload/design-preview', {
                imageData: previewDataURL
            });

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

            // const token = localStorage.getItem('token');
            // if (!token) {
            //     throw new Error('Токен авторизации отсутствует');
            // }

            // Сохраняем дизайн в историю
            // const designRequest = {
            //     name: `Дизайн ${new Date().toLocaleString()}`,
            //     description: 'Пользовательский дизайн',
            //     previewUrl: imageUrl,
            //     designData: JSON.stringify(designData),
            //     designHash: designHash,
            //     productType: selectedProduct?.id || 'unknown',
            // };

            // const saveDesignResponse = await authService.fetchWithRefresh('/api/profile/designs', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${token}`,
            //     },
            //     body: JSON.stringify(designRequest),
            // });
    
            // if (!saveDesignResponse.ok) {
            //     const errorText = await saveDesignResponse.text();
            //     throw new Error(`Ошибка сохранения в историю: ${saveDesignResponse.status} - ${errorText}`);
            // }

            // const savedDesign = await saveDesignResponse.json();
            // Создаем объект для корзины с полученным URL изображения
            const cartItem = {
                design: {
                    id: designId || generateGuid(),
                    name: `Дизайн ${new Date().toLocaleString()}`,
                    description: "Пользовательский дизайн",
                    previewUrl: imageUrl,
                    designData: JSON.stringify(designData),
                    designHash: designHash,
                    productType: selectedProduct?.id,
                    designType: "Custom"
                },
                quantity: 1,
                price: 1000 // Здесь нужна логика расчета цены
            };

            if (updateExisting && canUpdateDesign()) {
                const updateObj={
                    name: cartItem.design.name,
                    description: cartItem.design.description,
                    previewUrl: imageUrl,
                    designData: JSON.stringify(designData),
                    designHash: designHash,
                    productType: selectedProduct?.id
                }
                await authService.axiosWithRefresh('put', `/Design/${designId}`, JSON.stringify(updateObj));
                await authService.axiosWithRefresh('put', `/cart/update/${designId}`, JSON.stringify(cartItem));
                toast.success('Дизайн обновлен');
            } else {
                await authService.axiosWithRefresh('post', '/cart/add', JSON.stringify(cartItem));
                toast.success('Товар добавлен в корзину');
            }
        } catch (error: Error | unknown) {
            let errorMessage = 'Неизвестная ошибка';
            if (axios.isAxiosError(error) && error.response?.data) {
                if (axios.isAxiosError(error) && error.response?.data) {
                    errorMessage = JSON.stringify(error.response.data);
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            console.error('Ошибка:', errorMessage);
            toast.error(`Ошибка: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    // const getAllObjects = () =>{
    //     console.log('Canvas Objects:', canvasRef.current?.getObjects());
    //     console.log('Layers:', layers);
    //     console.log('selectedProduct: ', selectedProduct);
    // }

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
        setSelectedProduct({id:"shirt", type:"3D"});
        setSelectedLayerId(null);
        setCurrentText('Your Text Here');
        layers.forEach((layer) => removeLayer(layer.id));
        await clearStateFromIndexedDB();

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    function updateExistingProperties<T extends Layer>(target: T, source: Partial<T>){
        for (const key in source){
            if (source[key] !== undefined && key in target){
                target[key] = source[key] as T[Extract<keyof T, string>];
            }
        }
    }
    function handleUpdateObject(updatedProperties: Partial<Layer>) {
        if (selectedObject) {
            if (selectedObject.type === 'image' && updatedProperties.filters) {
                const img = selectedObject as fabric.Image;
                const newFilters = updatedProperties.filters
                    .map((f: SerializedFabricFilter) => createFilterByName(f.name, f.options))
                    .filter((f): f is fabric.IBaseFilter => f !== null);
                img.filters = newFilters;
                img.applyFilters();
                } else {
                // Обновляем другие свойства
                selectedObject.set(updatedProperties);
                }
            //обновляем свойства объекта на самом канвасе
            const selectedLayerIndex = layers.findIndex(layer => layer.id == selectedLayerId);
            if (selectedLayerIndex !== -1){
                const updatedLayer = { ...layers[selectedLayerIndex]}
                updateExistingProperties(updatedLayer, updatedProperties);
                const newLayers = [...layers];
                newLayers[selectedLayerIndex] = updatedLayer;
                setLayers(newLayers);
            }
            
            selectedObject.canvas?.renderAll();
        }
    }
    async function handleAddToCatalog(data: {name: string; description: string; price: number; tagIds: string[]; moderationStatus: "Approved" | "Rejected";}) {
        setIsSaving(true);
        if (!canvasRef.current) return;

        try {

            let dashedRect: fabric.Object | undefined;
            if (selectedProduct.type === 'regular') {
                dashedRect = canvasRef.current.getObjects().find(obj => obj.type === 'rect' && obj.strokeDashArray);
                if (dashedRect) {
                    dashedRect.set({ visible: false });
                    canvasRef.current.renderAll();
                }
            }
            // Получаем превью дизайна
            let overlayImage = canvasRef.current.overlayImage;
            if (!overlayImage)
                overlayImage = canvasRef.current?.backgroundImage as fabric.Image | undefined;
            const previewDataURL = canvasRef.current.toDataURL({
                format: 'png',
                quality: 1.0,
                top: overlayImage ? overlayImage.top : 0,
                left: overlayImage ? overlayImage.left : 0,
                width: overlayImage ? overlayImage.width : canvasRef.current.width,
                height: overlayImage ? overlayImage.height : canvasRef.current.height,
            });

            if (dashedRect) {
                dashedRect.set({ visible: true });
                canvasRef.current.renderAll();
            }

            // Загружаем превью в ImgBB
            const { imageUrl } = await authService.axiosWithRefresh<{ imageUrl: string }>(
                'post',
                '/upload/design-preview',
                { imageData: previewDataURL }
            );

            // Подготавливаем данные дизайна
            const designData = {
                canvasSize,
                prodType: selectedProduct,
                layers: layers.map((layer) => ({
                ...layer,
                url: layer.type === 'image' ? layer.url : undefined,
                })),
            };

            const designHash = CryptoJS.SHA256(JSON.stringify(designData)).toString();

            const designRequest = {
                id: designId || generateGuid(),
                name: data.name,
                description: data.description,
                previewUrl: imageUrl,
                designData: JSON.stringify(designData),
                designHash,
                productType: selectedProduct?.id,
                moderationStatus: data.moderationStatus,
                price: data.price,
                tagIds: data.tagIds,
            };

            // Отправляем дизайн напрямую в каталог
            await authService.axiosWithRefresh(
                'post',
                '/moderation/direct-catalog-add',
                JSON.stringify(designRequest)
            );

            toast.success(
                data.moderationStatus === 'Approved'
                ? 'Дизайн добавлен в каталог'
                : 'Дизайн отклонён'
            );
        } catch (error: unknown) {
            console.error('Ошибка:', error);
            if (error instanceof Error) {
                toast.error(`Ошибка: ${error.message}`);
            } else {
                toast.error('Ошибка: Неизвестная ошибка');
            }
        } finally {
            setIsSaving(false);
        }
    }
    return (
        <div className={styles.designContainer}>
            {isSaving && (
                <div className={styles.globalLoading}>
                    <div className={styles.globalLoadingSpinner}></div>
                    <div className={styles.globalLoadingText}>Сохранение...</div>
                </div>
            )}
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSelectProduct={handleProductSelect}
            />
            <div className={styles.constructorContent}>
                <div className={`${styles.constructorSidebar} ${styles.constructorSidebarLeft}`}>
                    <LayersPanel 
                        layers={layers}
                        selectedLayerId={selectedLayerId}
                        onSelectLayer={handleSelectLayer}
                        onMoveLayer={moveLayer}
                        onRemoveLayer={removeLayer}
                        onToggleVisibility={toggleLayerVisibility} />
                </div>

                <div className={styles.constructorCanvasArea}>
                    {isCanvasLoading && (
                    <div className={styles.canvasLoading}>
                        <div className={styles.canvasSpinner}></div>
                        <div className={styles.canvasLoadingText}>Загрузка канваса...</div>
                    </div>
                    )}
                    <canvas id="canvas"></canvas>
                </div>

                <div className={`${styles.constructorSidebar} ${styles.constructorSidebarRight}`}>
                    <div className={styles.buttonGroup}>
                        <div className={styles.fileInputWrapper}>
                            <button className={styles.fileInputButton}>
                                <span>Добавить изображение</span>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageUpload}
                                className={styles.fileInput}
                                accept="image/*"
                            />
                        </div>

                        <button 
                            onClick={handleAddText}
                            className={styles.constructorButton}
                        >
                            Добавить текст
                        </button>

                        <input
                            type="text"
                            value={currentText}
                            onChange={(e) => setCurrentText(e.target.value)}
                            placeholder="Введите текст"
                            className={styles.textInput}
                        />
                        
                        <button 
                            onClick={() => setIsProductModalOpen(true)}
                            className={styles.constructorButton}
                        >
                            Выбрать товар
                        </button>
                        
                        {/* <button 
                            onClick={getAllObjects}
                            className={styles.constructorButton}
                        >
                            Отладка
                        </button> */}
                        
                        <button 
                            onClick={() => saveDesign(false)}
                            className={styles.constructorButton}
                        >
                            {designId && !canUpdateDesign() ? 'В корзину' : 'Сохранить дизайн'}
                        </button>
                        
                        {designId && canUpdateDesign() && (
                            <button 
                                onClick={() => saveDesign(true)}
                                className={styles.constructorButton}
                            >
                                Обновить дизайн
                            </button>
                        )}
                        
                        <button 
                            onClick={resetDesign}
                            className={styles.constructorButton}
                        >
                            Очистить
                        </button>
                        
                        {designId && (
                            <button
                                onClick={() => {
                                    resetDesign();
                                    router.push('/constructor');
                                }}
                                className={styles.constructorButton}
                            >
                                Новый дизайн
                            </button>
                        )}
                        
                        {canShowCatalogButton && (
                            <button 
                                onClick={() => setIsCatalogModalOpen(true)}
                                className={styles.constructorButton}
                            >
                                Добавить напрямую в каталог
                            </button>
                        )}
                    </div>
                    <CatalogAddModal isOpen={isCatalogModalOpen} onClose={() => setIsCatalogModalOpen(false)} onSubmit={handleAddToCatalog}/>
                    <TabbedControls selectedObject={selectedObject} onUpdateObject={handleUpdateObject} />
                </div>
            </div>
        </div>
    );
};