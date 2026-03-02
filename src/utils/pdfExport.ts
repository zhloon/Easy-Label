import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import type { LabelElement } from '../types';

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MM_TO_PX = 3.78;
const ZOOM_FACTOR = 2;

function isBarcodeImage(data: Uint8ClampedArray, width: number, height: number): { isBarcode: boolean; reason: string } {
    let blackPixels = 0;
    let whitePixels = 0;
    let totalPixels = 0;
    let transitions = 0;
    
    const blackThreshold = 128;
    const sampleStep = Math.max(1, Math.floor(height / 100));
    
    for (let y = 0; y < height; y += sampleStep) {
        let prevIsBlack = false;
        let lineTransitions = 0;
        
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const alpha = data[idx + 3];
            
            if (alpha < 128) continue;
            
            totalPixels++;
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            const isBlack = gray < blackThreshold;
            
            if (isBlack) {
                blackPixels++;
            } else {
                whitePixels++;
            }
            
            if (x > 0 && isBlack !== prevIsBlack) {
                lineTransitions++;
            }
            prevIsBlack = isBlack;
        }
        transitions += lineTransitions;
    }
    
    if (totalPixels < 100) {
        return { isBarcode: false, reason: '内容太少' };
    }
    
    const blackRatio = blackPixels / totalPixels;
    const whiteRatio = whitePixels / totalPixels;
    
    if (blackRatio < 0.05 || whiteRatio < 0.05) {
        return { isBarcode: false, reason: '对比度不足，可能不是条码' };
    }
    
    if (blackRatio > 0.7 || whiteRatio > 0.7) {
        return { isBarcode: false, reason: '黑白比例不均衡，可能不是条码' };
    }
    
    const avgTransitionsPerLine = transitions / Math.ceil(height / sampleStep);
    if (avgTransitionsPerLine < 4) {
        return { isBarcode: false, reason: '条纹特征不明显，可能不是条码' };
    }
    
    return { isBarcode: true, reason: '' };
}

export async function captureCanvasHQ(canvasEl: HTMLElement, sizerEl: HTMLElement): Promise<string> {
    const wrapper = canvasEl.parentElement!;
    const origTransform = wrapper.style.transform;
    const origW = sizerEl.style.width;
    const origH = sizerEl.style.height;
    
    wrapper.style.transform = 'scale(1)';
    sizerEl.style.width = canvasEl.style.width;
    sizerEl.style.height = canvasEl.style.height;
    await new Promise(res => setTimeout(res, 100)); 
    
    const snapCanvas = await html2canvas(canvasEl, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = snapCanvas.toDataURL('image/jpeg', 1.0); 
    
    wrapper.style.transform = origTransform;
    sizerEl.style.width = origW;
    sizerEl.style.height = origH;
    return imgData;
}

export async function exportSinglePDF(canvasEl: HTMLElement, sizerEl: HTMLElement, wMM: number, hMM: number, fileName: string) {
    const orientation = wMM > hMM ? 'l' : 'p';
    const doc = new jsPDF({ orientation, unit: 'mm', format: [wMM, hMM] });
    const imgData = await captureCanvasHQ(canvasEl, sizerEl);
    doc.addImage(imgData, 'JPEG', 0, 0, wMM, hMM);
    doc.save(`${fileName}.pdf`);
}

export async function exportBatchPDF(
    file: File, canvasEl: HTMLElement, sizerEl: HTMLElement, wMM: number, hMM: number, fileName: string, barcodeElement: LabelElement,
    onProgress: (percent: number, current: number, total: number) => void
) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
    const numPages = pdf.numPages;

    const orientation = wMM > hMM ? 'l' : 'p';
    const doc = new jsPDF({ orientation, unit: 'mm', format: [wMM, hMM] });
    const pxToMm = 1 / (MM_TO_PX * ZOOM_FACTOR);
    
    const mmX = (parseFloat(barcodeElement.style.left) || 0) * pxToMm;
    const mmY = (parseFloat(barcodeElement.style.top) || 0) * pxToMm;
    const mmW = (parseFloat(barcodeElement.style.width) || 0) * pxToMm;
    const mmH = (parseFloat(barcodeElement.style.height) || 0) * pxToMm;

    const domElements = canvasEl.children;
    let hiddenNodes: {el: HTMLElement, display: string}[] = [];
    Array.from(domElements).forEach(node => {
        const el = node as HTMLElement;
        if (el.innerHTML.includes('占位条码')) { 
            hiddenNodes.push({ el, display: el.style.display }); 
            el.style.display = 'none'; 
        }
    });

    const templateImgData = await captureCanvasHQ(canvasEl, sizerEl);
    hiddenNodes.forEach(item => item.el.style.display = item.display);

    for (let i = 1; i <= numPages; i++) {
        onProgress(Math.round((i / numPages) * 100), i, numPages);
        
        const page = await pdf.getPage(i); 
        const viewport = page.getViewport({ scale: 6.0 }); 
        const tempCanvas = document.createElement('canvas'); 
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) continue;
        tempCanvas.width = viewport.width; 
        tempCanvas.height = viewport.height;
        
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;
        let top = null, bottom = null, left = null, right = null;
        let hasContent = false;
        for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
                const idx = (y * tempCanvas.width + x) * 4;
                const r = data[idx] as number; 
                const g = data[idx+1] as number; 
                const b = data[idx+2] as number; 
                const alpha = data[idx+3] as number;
                
                if (alpha > 10 && (r < 240 || g < 240 || b < 240)) {
                    hasContent = true;
                    if (top === null) top = y; bottom = y;
                    if (left === null || x < left) left = x;
                    if (right === null || x > right) right = x;
                }
            }
        }

        if (!hasContent) {
            throw new Error(`第 ${i} 页未检测到内容，请检查 PDF 文件！`);
        }

        let cropCanvas = tempCanvas;
        if (top !== null && bottom !== null && left !== null && right !== null) {
             const trimW = right - left + 1; const trimH = bottom - top + 1;
             if (trimW > 0 && trimH > 0) {
                 cropCanvas = document.createElement('canvas');
                 cropCanvas.width = trimW; cropCanvas.height = trimH;
                 cropCanvas.getContext('2d')?.drawImage(tempCanvas, left, top, trimW, trimH, 0, 0, trimW, trimH);
             }
        }

        const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
        if (cropCtx) {
            const cropImgData = cropCtx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
            const barcodeCheck = isBarcodeImage(cropImgData.data, cropCanvas.width, cropCanvas.height);
            if (!barcodeCheck.isBarcode) {
                throw new Error(`第 ${i} 页${barcodeCheck.reason}，请检查 PDF 文件是否包含有效条码！`);
            }
        }

        const barcodeImgData = cropCanvas.toDataURL('image/png', 1.0); 
        if (i > 1) doc.addPage([wMM, hMM], orientation); 
        doc.addImage(templateImgData, 'JPEG', 0, 0, wMM, hMM); 

        const imgRatio = cropCanvas.width / cropCanvas.height;
        const placeholderRatio = mmW / mmH;
        let finalW = mmW, finalH = mmH, finalX = mmX, finalY = mmY;

        if (imgRatio > placeholderRatio) {
            finalH = mmW / imgRatio;
            finalY = mmY + (mmH - finalH) / 2;
        } else {
            finalW = mmH * imgRatio;
            finalX = mmX + (mmW - finalW) / 2;
        }

        doc.addImage(barcodeImgData, 'PNG', finalX, finalY, finalW, finalH);
        await new Promise(res => setTimeout(res, 10)); 
    }
    doc.save(`${fileName}.pdf`);
}
