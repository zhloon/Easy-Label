/**
 * 智能图片去白边算法 (用于用户上传的普通图片)
 * 作用：读取图片，扫描所有非白像素的边界，并返回严丝合缝裁切后的图片
 */
export async function cropImageWhitespace(src: string): Promise<{url: string, width: number, height: number}> {
  // 定义失败时的兜底返回值（返回原图）
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
        
        // 针对矢量图(SVG)，放大两倍渲染成超清位图，防止裁切后失真模糊
        if (blob.type.includes('svg') || src.includes('.svg')) {
          w *= 2; h *= 2;
        }
        
        if (!ctx || w === 0 || h === 0) return resolve(fallback);
        
        canvas.width = w; canvas.height = h;
        
        // ★ 核心黑科技：注入纯白底漆。
        // 因为很多 SVG 和 PNG 的背景是全透明的，如果不填白色底，读取透明像素时会发生色差误判
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        
        let top: number | null = null, bottom: number | null = null, left: number | null = null, right: number | null = null;
        
        // 扫描全图寻找上下左右四个极限边界
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx] as number; 
            const g = data[idx + 1] as number; 
            const b = data[idx + 2] as number; 
            
            // 只要不是纯白色（因为上面填了纯白底），就说明这里有内容
            const isWhite = r > 240 && g > 240 && b > 240;
            if (!isWhite) {
              if (top === null) top = y; bottom = y;
              if (left === null || x < left) left = x;
              if (right === null || x > right) right = x;
            }
          }
        }
        
        // 如果全图都是白的，返回原图
        if (top === null || left === null || bottom === null || right === null) return resolve(fallback);
        
        const trimW = right - left + 1;
        const trimH = bottom - top + 1;
        if (trimW <= 0 || trimH <= 0) return resolve(fallback);

        // 创建新画布，进行像素级精确裁切
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