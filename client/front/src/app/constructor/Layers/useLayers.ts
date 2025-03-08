import { useState } from 'react';
import { fabric } from 'fabric';

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

const useLayers = (canvasRef: React.MutableRefObject<fabric.Canvas | null>) => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<number | string | null>(null);

    const addLayer = (layer: Layer) => {
        setLayers((prevLayers) => [...prevLayers, layer]);
    };

    const moveLayer = (index: number, direction: number) => {
        setLayers((prevLayers) => {
            const newLayers = [...prevLayers];
            const targetIndex = index + direction;

            if (targetIndex >= 0 && targetIndex < newLayers.length) {
                // Меняем местами слои в массиве
                [newLayers[index], newLayers[targetIndex]] = [newLayers[targetIndex], newLayers[index]];

                // Синхронизируем порядок объектов на канвасе
                const canvas = canvasRef.current;
                if (canvas) {
                    const objects = canvas.getObjects().filter((obj) => obj.data?.id); // Предполагаем, что у объектов есть data.id
                    const currentLayer = newLayers[index];
                    const targetLayer = newLayers[targetIndex];

                    const currentObject = objects.find((obj) => obj.data?.id === currentLayer.id);
                    const targetObject = objects.find((obj) => obj.data?.id === targetLayer.id);

                    if (currentObject && targetObject) {
                        const currentCanvasIndex = canvas.getObjects().indexOf(currentObject);
                        const targetCanvasIndex = canvas.getObjects().indexOf(targetObject);

                        // Перемещаем объект на канвасе
                        canvas.moveTo(currentObject, targetCanvasIndex);
                        canvas.renderAll();
                    }
                }

                return newLayers;
            }

            return prevLayers;
        });
    };

    return {
        layers,
        selectedLayerId,
        addLayer,
        moveLayer,
        setSelectedLayerId,
    };
};

export default useLayers;