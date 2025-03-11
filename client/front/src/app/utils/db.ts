import { openDB, IDBPDatabase } from 'idb';
// import { Layer } from '@/app/constructor/Layers/useLayers';

let dbPromise: Promise<IDBPDatabase> | undefined;

if (typeof window !== 'undefined') {
    dbPromise = openDB('designDB', 1, {
        upgrade(db) {
            db.createObjectStore('designState', { keyPath: 'id' });
        },
    });
}


// interface DesignState {
//     selectedProduct: {
//         id: string;
//         type: string;
//     } | null;
//     layers: Layer[];
//     selectedLayerId: string | number | null;
//     currentText: string;
//     canvasSize: {
//         width: number;
//         height: number;
//     };
// }

export const saveStateToIndexedDB = async (state: string) => {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.put('designState', { id: 'currentState', data: state });
};

export const getStateFromIndexedDB = async () => {
    if (!dbPromise) return null;
    const db = await dbPromise;
    const state = await db.get('designState', 'currentState');
    return state ? state.data : null;
};

export const clearStateFromIndexedDB = async () => {
    if (!dbPromise) return;
    const db = await dbPromise;
    await db.delete('designState', 'currentState');
};