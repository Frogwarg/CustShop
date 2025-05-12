import { useState } from 'react';
import { fabric } from 'fabric';

export interface SerializedFabricFilter {
    name: string;
    options?: Record<string, unknown>;
  }  

export interface Layer {
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
    fontFamily?: string;
    filters?: SerializedFabricFilter[];
    fill?: string;
    flipX?: boolean;
    flipY?: boolean;
    angle?: number;
    visible?: boolean;
    scaleX?: number;
    scaleY?: number;
}

const useLayers = (canvasRef: React.MutableRefObject<fabric.Canvas | null>) => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<number | string | null>(null);

    const addLayer = (layer: Layer) => {
        const newLayer = { ...layer, visible: layer.visible !== undefined ? layer.visible : true };
        setLayers((prevLayers) => [...prevLayers, newLayer]);
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
                    newLayers.forEach((layer, newIndex) => {
                        const obj = objects.find((o) => o.data?.id === layer.id);
                        if (obj) {
                            // Перемещаем объект на нужный индекс среди пользовательских объектов
                            const baseIndex = canvas.getObjects().indexOf(objects[0]); // Индекс первого пользовательского объекта
                            canvas.moveTo(obj, baseIndex + newIndex);
                        }
                    });

                    canvas.renderAll();
                }

                return newLayers;
            }

            return prevLayers;
        });
    };

    const removeLayer = (layerId: number | string) => {
        setLayers((prevLayers) => {
            const layerToRemove = prevLayers.find((layer) => layer.id === layerId);
            if (!layerToRemove) return prevLayers;

            const canvas = canvasRef.current;
            if (canvas) {
                const obj = canvas.getObjects().find((o) => o.data?.id === layerId);
                if (obj) {
                    canvas.remove(obj);
                    canvas.renderAll();
                }
            }

            const newLayers = prevLayers.filter((layer) => layer.id !== layerId);
            return newLayers;
        });

        if (selectedLayerId === layerId) {
            setSelectedLayerId(null);
        }
    };

    const toggleLayerVisibility = (layerId: number | string) => {
        setLayers((prevLayers) =>
            prevLayers.map((layer) =>
                layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
            )
        );
    
        const canvas = canvasRef.current;
        if (canvas) {
            const obj = canvas.getObjects().find((o) => o.data?.id === layerId);
            if (obj) {
                obj.set({ visible: !obj.visible }); // Обновляем видимость объекта
                canvas.renderAll();
            }
        }
    };

    return {
        layers,
        selectedLayerId,
        addLayer,
        moveLayer,
        removeLayer,
        toggleLayerVisibility,
        setSelectedLayerId,
        setLayers
    };
};

export default useLayers;