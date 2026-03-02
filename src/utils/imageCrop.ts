// src/utils/imageCrop.ts

export async function cropImageWhitespace(src: string): Promise<{url: string, width: number, height: number}> {
  const fallback = { url: src, width: 100, height: 100 };
  try {
    const response = await fetch(src, { mode: 'cors' });
    const blob = await response.blob();

    if (blob.type.includes('svg') || src.includes('.svg')) {
      const text = await blob.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "image/svg+xml");
      const svgEl = doc.documentElement as unknown as SVGSVGElement;

      if (svgEl.tagName.toLowerCase() === 'svg') {
        const container = document.createElement('div');
        container.style.visibility = 'hidden';
        container.style.position = 'absolute';
        container.style.top = '-9999px';
        document.body.appendChild(container);
        container.appendChild(svgEl);

        const bbox = svgEl.getBBox();
        svgEl.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        svgEl.removeAttribute('width');
        svgEl.removeAttribute('height');

        const serializer = new XMLSerializer();
        const newSvgStr = serializer.serializeToString(svgEl);
        document.body.removeChild(container);

        const encoded = btoa(unescape(encodeURIComponent(newSvgStr)));
        return { 
          url: 'data:image/svg+xml;base64,' + encoded, 
          width: Math.max(10, bbox.width), 
          height: Math.max(10, bbox.height) 
        };
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    return await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        fallback.width = img.naturalWidth || 100;
        fallback.height = img.naturalHeight || 100;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let w = img.naturalWidth; let h = img.naturalHeight;
        
        if (!ctx || w === 0 || h === 0) return resolve(fallback);
        
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        
        let top: number | null = null, bottom: number | null = null, left: number | null = null, right: number | null = null;
        
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            // ★ 修复：强断言 as number，彻底解决 TS 的 undefined 红线报错！
            const r = data[idx] as number; 
            const g = data[idx + 1] as number; 
            const b = data[idx + 2] as number; 
            const alpha = data[idx + 3] as number;
            
            const isWhite = r > 240 && g > 240 && b > 240;
            if (alpha > 10 && !isWhite) {
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