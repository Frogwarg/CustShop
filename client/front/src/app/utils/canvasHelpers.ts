import { fabric } from 'fabric';

export const createClipPath = (
    overlayLeft: number,
    overlayTop: number,
    width: number,
    height: number
) => {
    return new fabric.Rect({
        left: overlayLeft + 1,
        top: overlayTop + 1,
        width: width - 3,
        height: height - 3,
        absolutePositioned: true
    });
}; 

export const setupOverlayImage = (overlayImg: fabric.Image) => {
    overlayImg.set({
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true
    });
    return overlayImg;
};

export const calculateImageDimensions = (
    img: HTMLImageElement,
    canvasWidth: number
) => {
    const aspectRatio = img.width / img.height;
    const newWidth = img.width > canvasWidth ? canvasWidth/2 : img.width/2;
    const newHeight = newWidth / aspectRatio;
    const scaleX = newWidth / img.width;
    const scaleY = newHeight / img.height;

    return { newWidth, newHeight, scaleX, scaleY };
};

export const exportDesign = (
    canvas: fabric.Canvas,
    overlayImage: fabric.Image | undefined
) => {
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        top: overlayImage ? overlayImage.top : 0,
        left: overlayImage ? overlayImage.left : 0,
        width: overlayImage ? overlayImage.width : canvas.width,
        height: overlayImage ? overlayImage.height : canvas.height
    });

    const link = document.createElement('a');
    link.download = 'design.png';
    link.href = dataURL;
    link.click();
};