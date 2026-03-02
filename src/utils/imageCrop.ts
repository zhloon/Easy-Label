// src/utils/imageCrop.ts

export async function cropImageWhitespace(src: string): Promise<{url: string, width: number, height: number}> {
  const fallback = { url: src, width: 100, height: 100 };
  try {
    const response = await fetch(src, { mode: 'cors' });
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        fallback.width = img.naturalWidth || 100;
        fallback.height = img.naturalHeight || 100;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        let w = img.naturalWidth || 1024; 
        let h = img.naturalHeight || 1024;
        
        if (blob.type.includes('svg') || src.includes('.svg')) {
          w *= 2; h *= 2;
        }
        
        if (!ctx || w === 0 || h === 0) return resolve(fallback);
        
        canvas.width = w; canvas.height = h;
        
        // ★ 核心修复：填充纯白背景，将所有透明像素转化为白色，让黑框边界检测万无一失
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        
        let top: number | null = null, bottom: number | null = null, left: number | null = null, right: number | null = null;
        
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx] as number; 
            const g = data[idx + 1] as number; 
            const b = data[idx + 2] as number; 
            
            // 由于背景已经填了纯白，只要不是白色（RGB < 240）的像素就是实体的图标/边框
            const isWhite = r > 240 && g > 240 && b > 240;
            if (!isWhite) {
              if (top === null) top = y; bottom = y;
              if (left === null || x < left) left = x;
              if (right === null || x > right) right = x;
            }
          }
        }
        
        if (top === null || left === null || bottom === null || right === null) return resolve(fallback);
        
        const trimW = right - left + 1;
        const trimH = bottom - top + 1;
        if (trimW <= 0 || trimH <= 0) return resolve(fallback);

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = trimW; cropCanvas.height = trimH;
        cropCanvas.getContext('2d')?.drawImage(canvas, left, top, trimW, trimH, 0, 0, trimW, trimH);
        
        resolve({ url: cropCanvas.toDataURL('image/png', 1.0), width: trimW, height: trimH });
      };
      img.onerror = () => resolve(fallback);
      img.src = objectUrl;
    });

  } catch (e) {
    return fallback;
  }
}