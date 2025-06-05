import { Layer } from '../design-constructor/Layers/useLayers';
import { fabric } from 'fabric';
export const dataURLtoBlob = (dataURL: string) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
};

export const updateExistingProperties = <T extends Layer>(target: T, source: Partial<T>) =>{
        for (const key in source){
            if (source[key] !== undefined && key in target){
                target[key] = source[key] as T[Extract<keyof T, string>];
            }
        }
    }

export const generateGuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

export const createFilterByName = (name: string, options: Record<string, unknown> = {}): fabric.IBaseFilter | null => {
      switch (name) {
        case 'Brightness':
          return new fabric.Image.filters.Brightness({ brightness: options.brightness as number });
        case 'Grayscale':
          return new fabric.Image.filters.Grayscale();
        case 'Sepia':
          return new fabric.Image.filters.Sepia();
        case 'Invert':
          return new fabric.Image.filters.Invert();
        default:
          console.warn(`Неизвестный фильтр: ${name}`);
          return null;
      }
    }

export const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}