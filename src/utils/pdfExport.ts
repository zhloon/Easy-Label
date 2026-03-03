import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import type { LabelElement } from '../types';

// 配置 PDF.js 的底层 Worker 路径（用于解析 PDF 二进制流）
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// 全局常量：毫米与像素的转换比例及清晰度缩放因子
const MM_TO_PX = 3.78;
const ZOOM_FACTOR = 2;

/**
 * 高清截取当前 Vue 画板内容，将其转换为 Base64 图像
 */
export async function captureCanvasHQ(canvasEl: HTMLElement, sizerEl: HTMLElement): Promise<string> {
    const wrapper = canvasEl.parentElement!;
    const origTransform = wrapper.style.transform;
    const origW = sizerEl.style.width;
    const origH = sizerEl.style.height;
    
    // 截图前强制将画布缩放还原为 1:1，确保截图尺寸和物理尺寸精准匹配
    wrapper.style.transform = 'scale(1)';
    sizerEl.style.width = canvasEl.style.width;
    sizerEl.style.height = canvasEl.style.height;
    await new Promise(res => setTimeout(res, 100)); // 等待 DOM 渲染完毕
    
    // 使用 html2canvas 进行 4 倍超清渲染
    const snapCanvas = await html2canvas(canvasEl, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = snapCanvas.toDataURL('image/jpeg', 1.0); 
    
    // 恢复原来的缩放和尺寸
    wrapper.style.transform = origTransform;
    sizerEl.style.width = origW;
    sizerEl.style.height = origH;
    return imgData;
}

/**
 * 导出单张静态 PDF 标签（不包含批量合成逻辑）
 */
export async function exportSinglePDF(canvasEl: HTMLElement, sizerEl: HTMLElement, wMM: number, hMM: number, fileName: string) {
    const orientation = wMM > hMM ? 'l' : 'p'; // 自动判断横向还是纵向
    const doc = new jsPDF({ orientation, unit: 'mm', format: [wMM, hMM] });
    const imgData = await captureCanvasHQ(canvasEl, sizerEl);
    doc.addImage(imgData, 'JPEG', 0, 0, wMM, hMM);
    doc.save(`${fileName}.pdf`);
}

/**
 * 核心批量合成引擎：读取上传的 PDF，进行智能裁切，并与模板进行合成
 */
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
    
    // 计算条码占位符在 PDF 中的物理坐标和尺寸 (毫米)
    const mmX = (parseFloat(barcodeElement.style.left) || 0) * pxToMm;
    const mmY = (parseFloat(barcodeElement.style.top) || 0) * pxToMm;
    const mmW = (parseFloat(barcodeElement.style.width) || 0) * pxToMm;
    const mmH = (parseFloat(barcodeElement.style.height) || 0) * pxToMm;

    // 截图前，暂时隐藏掉条码占位符本身
    const domElements = canvasEl.children;
    let hiddenNodes: {el: HTMLElement, display: string}[] = [];
    Array.from(domElements).forEach(node => {
        const el = node as HTMLElement;
        if (el.innerHTML.includes('占位条码')) { 
            hiddenNodes.push({ el, display: el.style.display }); 
            el.style.display = 'none'; 
        }
    });

    // 截取没有条码的“纯净版”底图模板
    const templateImgData = await captureCanvasHQ(canvasEl, sizerEl);
    
    // 恢复占位符显示，不影响界面UI
    hiddenNodes.forEach(item => item.el.style.display = item.display);

    // 遍历 PDF 的每一页进行处理
    for (let i = 1; i <= numPages; i++) {
        onProgress(Math.round((i / numPages) * 100), i, numPages);
        
        const page = await pdf.getPage(i); 
        const viewport = page.getViewport({ scale: 6.0 }); // 以 6 倍超清比例渲染当前页
        const tempCanvas = document.createElement('canvas'); 
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) continue;
        tempCanvas.width = viewport.width; 
        tempCanvas.height = viewport.height;
        
        await (page as any).render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;
        
        // --- 第一步：检测页面是否有内容 ---
        const rowHasContent = new Array(tempCanvas.height).fill(false);
        let hasAnyContent = false;
        for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
                const idx = (y * tempCanvas.width + x) * 4;
                const r = data[idx] as number; const g = data[idx+1] as number; const b = data[idx+2] as number; const alpha = data[idx+3] as number;
                // 剔除白色背景，只要发现像素，标记该行有内容
                if (alpha > 10 && (r < 240 || g < 240 || b < 240)) {
                    rowHasContent[y] = true; 
                    hasAnyContent = true;
                    break;
                }
            }
        }

        let cropCanvas = tempCanvas;
        
        // 如果页面不为空，执行智能裁切算法
        if (hasAnyContent) {
            // --- 第二步：将连续的内容划分为物理区块 (Block) ---
            const blocks: {top: number, bottom: number}[] = [];
            let currentBlock: {top: number, bottom: number} | null = null;
            const gapTolerance = Math.max(10, Math.floor(tempCanvas.height * 0.02)); // 容忍块与块之间 2% 高度的空白
            let emptyCount = 0;
            
            for (let y = 0; y < tempCanvas.height; y++) {
                if (rowHasContent[y]) {
                    if (!currentBlock) currentBlock = { top: y, bottom: y };
                    else currentBlock.bottom = y;
                    emptyCount = 0;
                } else {
                    if (currentBlock) {
                        emptyCount++;
                        if (emptyCount > gapTolerance) {
                            blocks.push(currentBlock);
                            currentBlock = null;
                        }
                    }
                }
            }
            if (currentBlock) blocks.push(currentBlock);

            // --- 第三步：寻找“黑白跳变率”最高的区块（即疑似条形码所在的区块） ---
            let bestBlock = blocks[0];
            let globalMaxTrans = 0;

            for (const block of blocks) {
                let blockMaxTrans = 0;
                for (let y = block.top; y <= block.bottom; y++) {
                    let lineTrans = 0;
                    let prevBlack = false;
                    for (let x = 0; x < tempCanvas.width; x++) {
                        const idx = (y * tempCanvas.width + x) * 4;
                        const r = data[idx] as number; const g = data[idx+1] as number; const b = data[idx+2] as number; const alpha = data[idx+3] as number;
                        const isBlack = alpha > 50 && r < 120 && g < 120 && b < 120;
                        if (isBlack !== prevBlack) {
                            lineTrans++;
                            prevBlack = isBlack;
                        }
                    }
                    if (lineTrans > blockMaxTrans) blockMaxTrans = lineTrans;
                }
                if (blockMaxTrans > globalMaxTrans) {
                    globalMaxTrans = blockMaxTrans;
                    bestBlock = block; // 锁定跳变最密集的区块
                }
            }

            let top = null, bottom = null, left = null, right = null;

            // --- 第四步：确定上下边界 ---
            if (globalMaxTrans > 15) {
                // 如果发现明显的条码特征，只保留该区块（从而丢弃顶部的 EC REP 等图标）
                top = bestBlock.top;
                bottom = bestBlock.bottom;
            } else {
                // 如果没有条码特征（比如全是文字），则保留整个页面的所有内容
                top = blocks[0].top;
                bottom = blocks[blocks.length - 1].bottom;
            }

            // --- 第五步：在确定的上下边界内，扫描出左右紧贴的边界 ---
            left = tempCanvas.width; right = 0;
            for (let y = top; y <= bottom; y++) {
                for (let x = 0; x < tempCanvas.width; x++) {
                    const idx = (y * tempCanvas.width + x) * 4;
                    const r = data[idx] as number; const g = data[idx+1] as number; const b = data[idx+2] as number; const alpha = data[idx+3] as number;
                    if (alpha > 10 && (r < 240 || g < 240 || b < 240)) {
                        if (x < left) left = x;
                        if (x > right) right = x;
                    }
                }
            }

            // --- 第六步：执行最终的去白边裁切 ---
            if (top !== null && bottom !== null && left !== null && right !== null) {
                 const trimW = right - left + 1; const trimH = bottom - top + 1;
                 if (trimW > 0 && trimH > 0) {
                     cropCanvas = document.createElement('canvas');
                     cropCanvas.width = trimW; cropCanvas.height = trimH;
                     cropCanvas.getContext('2d')?.drawImage(tempCanvas, left, top, trimW, trimH, 0, 0, trimW, trimH);
                 }
            }
        }

        const barcodeImgData = cropCanvas.toDataURL('image/png', 1.0); 
        
        // 除了第一页外，后续都需要动态增加新的 PDF 页
        if (i > 1) doc.addPage([wMM, hMM], orientation); 
        
        // 先铺上底图模板
        doc.addImage(templateImgData, 'JPEG', 0, 0, wMM, hMM); 

        // --- 第七步：原比例无损居中算法 ---
        if (hasAnyContent) {
            const imgRatio = cropCanvas.width / cropCanvas.height;
            const placeholderRatio = mmW / mmH;
            let finalW = mmW, finalH = mmH, finalX = mmX, finalY = mmY;

            // 判断以宽还是高为基准缩放，确保内容不会溢出或被拉伸
            if (imgRatio > placeholderRatio) {
                finalH = mmW / imgRatio;
                finalY = mmY + (mmH - finalH) / 2; // 垂直居中
            } else {
                finalW = mmH * imgRatio;
                finalX = mmX + (mmW - finalW) / 2; // 水平居中
            }

            // 将处理后的独立条码/内容贴合到计算好的位置
            doc.addImage(barcodeImgData, 'PNG', finalX, finalY, finalW, finalH);
        }
        
        // 增加短暂延时，防止连续处理导致内存溢出或 UI 卡死
        await new Promise(res => setTimeout(res, 10)); 
    }
    
    // 触发下载
    doc.save(`${fileName}.pdf`);
}