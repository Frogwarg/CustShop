"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import Image from 'next/image';

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
    const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth * 0.8, height: window.innerHeight });
    const canvasRef = useRef<fabric.Canvas | null>(null);

    const updateCanvasSize = () => {
        const newWidth = window.innerWidth * 0.8;
        const newHeight = window.innerHeight * 0.8;
        setCanvasSize({ width: newWidth, height: newHeight });
    };

    useEffect(() => {
        window.addEventListener('resize', updateCanvasSize);

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, []);

    //const maskImageSrc = '/products/shirt-mask.png';

    useEffect(() => {
        const canvas = new fabric.Canvas('canvas', {
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: backgroundColor,
        });
        canvasRef.current = canvas;

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
                const newWidth = 200;
                const newHeight = newWidth / aspectRatio;
                const fabricImage = new fabric.Image(img, {
                    left: canvasSize.width / 2 - newWidth / 2,
                    top: canvasSize.height / 2 - newHeight / 2,
                    width: newWidth,
                    height: newHeight,
                });
                canvasRef.current?.add(fabricImage);
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
                        url: reader.result 
                    }
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
        canvasRef.current?.add(text);
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

    const handleSelectLayer = useCallback((layerId: number | string) => {
        setSelectedLayerId(layerId);
    }, []);

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
        const newLayers = [...layers];
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < layers.length) {
            [newLayers[index], newLayers[newIndex]] = [newLayers[newIndex], newLayers[index]];
            setLayers(newLayers);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent:'space-between' }}>
            <div style={{ width: '200px', marginRight: '20px' }}>
                <h3>Layers</h3>
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
                                (<Image src={layer.url as string} alt="layer thumbnail" width={50} height={50} style={{ objectFit: 'cover' }}/>) 
                             :(<span>{`Text: "${layer.text}"`}</span>)
                        }
                        <div>
                            <button onClick={() => moveLayer(layers.length - 1 - index, 1)}>Up</button>
                            <button onClick={() => moveLayer(layers.length - 1 - index, -1)}>Down</button>
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
