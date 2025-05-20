import React from 'react';
import Image from 'next/image';
import styles from '../constructor.module.css';

interface Layer {
    id: number | string;
    type: 'image' | 'text';
    url?: string | ArrayBuffer | null;
    text?: string;
    visible?: boolean;
}

interface LayersPanelProps {
    layers: Layer[];
    selectedLayerId: number | string | null;
    onSelectLayer: (layerId: number | string) => void;
    onMoveLayer: (index: number, direction: number) => void;
    onRemoveLayer: (layerId: number | string) => void;
    onToggleVisibility: (layerId: number | string) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({ layers, selectedLayerId, onSelectLayer, onMoveLayer, onRemoveLayer, onToggleVisibility }) => {
    return (
        <div className={styles.layersPanel}>
            <h3>Слои</h3>
            {layers.slice().reverse().map((layer) => (
                <div
                    key={layer.id}
                    className={`${styles.layerItem} ${
                        layer.id === selectedLayerId ? styles.layerItemActive : ''
                    }`}
                    onClick={() => onSelectLayer(layer.id)}
                >
                    {layer.type === 'image' ? (
                        <div>
                            <Image src={layer.url as string} alt="layer thumbnail" width={80} height={80} className={styles.layerThumbnail}  />
                            <span>Изображение</span>
                        </div>
                    ) : (
                        <span>{`Текст: "${layer.text}"`}</span>
                    )}
                    <div className={styles.layerControls}>
                        <button 
                            className={styles.layerControlButton}
                            onClick={(e) => { e.stopPropagation(); onMoveLayer(layers.indexOf(layer), 1); }}
                            title="Переместить вверх"
                        >
                            ↑
                        </button>
                        <button 
                            className={styles.layerControlButton}
                            onClick={(e) => { e.stopPropagation(); onMoveLayer(layers.indexOf(layer), -1); }}
                            title="Переместить вниз"
                        >
                            ↓
                        </button>
                        <button 
                            className={styles.layerControlButton}
                            onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                            title={layer.visible === false ? 'Показать' : 'Скрыть'}
                        >
                            {layer.visible === false ? '👁️' : '👁️'}
                        </button>
                        <button 
                            className={styles.layerControlButton}
                            onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id); }}
                            title="Удалить"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LayersPanel;