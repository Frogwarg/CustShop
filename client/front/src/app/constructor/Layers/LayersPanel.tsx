import React from 'react';
import Image from 'next/image';

interface Layer {
    id: number | string;
    type: 'image' | 'text';
    url?: string | ArrayBuffer | null;
    text?: string;
}

interface LayersPanelProps {
    layers: Layer[];
    selectedLayerId: number | string | null;
    onSelectLayer: (layerId: number | string) => void;
    onMoveLayer: (index: number, direction: number) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({ layers, selectedLayerId, onSelectLayer, onMoveLayer }) => {
    return (
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
                        backgroundColor: layer.id === selectedLayerId ? '#e0e0e0' : 'transparent',
                    }}
                    onClick={() => onSelectLayer(layer.id)}
                >
                    {layer.type === 'image' ? (
                        <Image src={layer.url as string} alt="layer thumbnail" width={50} height={50} style={{ objectFit: 'cover' }} />
                    ) : (
                        <span>{`Text: "${layer.text}"`}</span>
                    )}
                    <div>
                        <button onClick={(e) => { e.stopPropagation(); onMoveLayer(layers.indexOf(layer), 1); }}>
                            Up
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onMoveLayer(layers.indexOf(layer), -1); }}>
                            Down
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LayersPanel;