<template>
  <div class="flex-1 w-full h-full bg-slate-100 relative overflow-hidden" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
    
    <div class="absolute bottom-6 right-6 flex gap-2 shadow-lg bg-white rounded-lg p-2 z-10">
      <button @click="resetZoom" class="p-2 hover:bg-slate-100 rounded text-sm text-slate-700 font-medium">
        🔍 居中视图
      </button>
      <button @click="clearCanvas" class="p-2 hover:bg-slate-100 rounded text-sm text-red-600 font-medium">
        🗑️ 清空画布
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as fabric from 'fabric';

// 从您的 store 中获取当前选中的标签数据
// import { useMainStore } from '../store/useMainStore';
// const store = useMainStore();

const containerRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

// 全局维护 Fabric 实例
let fCanvas: fabric.Canvas | null = null;
let paperRect: fabric.Rect | null = null; // 底层白纸

// ==========================================
// 🌟 1. 初始化 Fabric 画布
// ==========================================
const initCanvas = () => {
  if (!canvasRef.value || !containerRef.value) return;

  fCanvas = new fabric.Canvas(canvasRef.value, {
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
    backgroundColor: '#f1f5f9', // 浅蓝灰工作区背景
    preserveObjectStacking: true, // 选中对象时，保持原有层级不变
    selection: true, // 允许框选多个组件
  });

  // 🖱️ 开启鼠标滚轮缩放功能
  fCanvas.on('mouse:wheel', (opt) => {
    // 🌟 核心修复 1：显式断言原生事件为 WheelEvent (滚轮事件)
    const evt = opt.e as WheelEvent; 
    
    const delta = evt.deltaY;
    let zoom = fCanvas!.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20; 
    if (zoom < 0.1) zoom = 0.1; 
    
    // 🌟 核心修复 2：使用 new fabric.Point 包装坐标
    fCanvas!.zoomToPoint(new fabric.Point(evt.offsetX, evt.offsetY), zoom);
    
    evt.preventDefault();
    evt.stopPropagation();
  });

  // 🌟 定义局部变量来记录画布拖拽状态，完美避开 TS 报错
  let isDragging = false;
  let lastPosX = 0;
  let lastPosY = 0;

  // 🖱️ 开启按住 Alt 键拖拽平移画布功能
  fCanvas.on('mouse:down', (opt) => {
    const evt = opt.e as MouseEvent;
    if (evt.altKey === true) {
      isDragging = true;            // 改用局部变量
      fCanvas!.selection = false;   // selection 是原生属性，不会报错
      lastPosX = evt.clientX;       // 记录 X 坐标
      lastPosY = evt.clientY;       // 记录 Y 坐标
    }
  });

  fCanvas.on('mouse:move', (opt) => {
    if (isDragging) {
      const e = opt.e as MouseEvent;
      const vpt = fCanvas!.viewportTransform!;
      
      // 使用局部变量计算偏移量
      vpt[4] += e.clientX - lastPosX;
      vpt[5] += e.clientY - lastPosY;
      
      fCanvas!.requestRenderAll();
      
      // 更新局部变量
      lastPosX = e.clientX;
      lastPosY = e.clientY;
    }
  });

  fCanvas.on('mouse:up', () => {
    if (fCanvas!.viewportTransform) {
      fCanvas!.setViewportTransform(fCanvas!.viewportTransform);
    }
    isDragging = false;           // 释放拖拽状态
    fCanvas!.selection = true;    // 恢复框选功能
  });

  fCanvas.on('mouse:up', () => {
    // 恢复当前的视口变换矩阵
    if (fCanvas!.viewportTransform) {
      fCanvas!.setViewportTransform(fCanvas!.viewportTransform);
    }
    
    // 🌟 核心修复：直接修改局部变量，去掉前面的 fCanvas!.
    isDragging = false;           
    
    // 恢复画布的框选功能 (selection 是原生属性，不会报错)
    fCanvas!.selection = true;    
  });
  
  // 监听窗口大小改变，重置画布宽高
  window.addEventListener('resize', handleResize);
};

const handleResize = () => {
  if (fCanvas && containerRef.value) {
    // 🌟 核心修复：使用 setDimensions 统一设置宽高，TS 完美支持，且性能更好
    fCanvas.setDimensions({
      width: containerRef.value.clientWidth,
      height: containerRef.value.clientHeight
    });
    
    // 重新渲染画布以适应新尺寸
    fCanvas.requestRenderAll();
  }
};

// ==========================================
// 🌟 2. 核心：根据 JSON 渲染标签
// ==========================================
const renderLabelData = (labelData: any) => {
  if (!fCanvas) return;
  fCanvas.clear(); 
  fCanvas.backgroundColor = '#f1f5f9';

  // 毫米转像素基准 (以常见 203 DPI 打印机为例，1mm ≈ 8px；如果按屏幕 96dpi 算，1mm ≈ 3.78px)
  const mmToPx = 3.78; 
  const paperW = (labelData.wMM || 100) * mmToPx;
  const paperH = (labelData.hMM || 100) * mmToPx;

  // 👉 2.1 绘制标签底纸 (白底阴影)
  paperRect = new fabric.Rect({
    left: (fCanvas.width! - paperW) / 2,
    top: (fCanvas.height! - paperH) / 2,
    width: paperW,
    height: paperH,
    fill: '#ffffff',
    selectable: false, // 纸张不可选中和拖动
    evented: false,
    shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.15)', blur: 15, offsetX: 5, offsetY: 5 })
  });
  fCanvas.add(paperRect);

  // 👉 2.2 遍历渲染元素
  const elements = labelData.elements || [];
  
  elements.forEach((el: any) => {
    let fObj: fabric.Object | null = null;
    
    // 解析原数据中的位置和尺寸 (去掉 'px')
    const parsePx = (val: string | number) => parseFloat(String(val).replace('px', '')) || 0;
    
    // 元素的绝对坐标 = 纸张原点坐标 + 元素相对纸张的 left/top
    const left = paperRect!.left! + parsePx(el.style?.left);
    const top = paperRect!.top! + parsePx(el.style?.top);
    const width = parsePx(el.style?.width || 100);
    const height = parsePx(el.style?.height || 20);

    // 🔴 文本渲染：使用 Textbox，天然支持多行和双击编辑！
    if (el.type === 'text') {
      fObj = new fabric.Textbox(el.content || '请输入文字', {
        left, top, width,
        fontSize: parsePx(el.fontSize || 14),
        fontWeight: el.fontWeight === 'bold' ? 'bold' : 'normal',
        fontFamily: 'Microsoft YaHei, sans-serif',
        fill: '#000000',
        splitByGrapheme: true, // 完美支持中文换行
        lineHeight: el.style?.lineHeight || 1.2,
      });
    } 
    // 🔴 线条渲染
    else if (el.type === 'line') {
      const isVertical = el.isVertical === 'true';
      fObj = new fabric.Line(
        [left, top, isVertical ? left : left + width, isVertical ? top + height : top], 
        { stroke: '#000000', strokeWidth: 1.5, padding: 5 } // padding 增加线的点击热区
      );
    } 
    // 🔴 条码占位 (后续可使用 jsbarcode 渲染为 Base64 传入 fabric.Image)
    else if (el.type === 'barcode') {
      fObj = new fabric.Rect({
        left, top, width: el.customW || width, height: el.customH || height,
        fill: '#f8fafc', stroke: '#94a3b8', strokeDashArray: [4, 4],
      });
      // 可以附加文本说明
      const tagText = new fabric.Text('条码占位: ' + el.content, {
        left: left + 5, top: top + 5, fontSize: 12, fill: '#64748b'
      });
      // 将底框和文字合成一个组
      fObj = new fabric.Group([fObj, tagText], { left, top });
    }

    // 将生成的组件加入画布
    if (fObj) {
      // 保存一下原始 ID，方便后续修改和保存
      fObj.set('id', el.id); 
      fCanvas!.add(fObj);
    }
  });

  fCanvas.renderAll();
  resetZoom(); // 渲染完毕后自动居中视角
};

// ==========================================
// 🌟 辅助功能
// ==========================================
const resetZoom = () => {
  if (!fCanvas || !paperRect) return;
  // 恢复 1:1 缩放
  fCanvas.setZoom(1);
  // 计算纸张中心点，将其挪到画布中心
  const vpt = fCanvas.viewportTransform!;
  vpt[4] = (fCanvas.width! - paperRect.width!) / 2 - paperRect.left!;
  vpt[5] = (fCanvas.height! - paperRect.height!) / 2 - paperRect.top!;
  fCanvas.requestRenderAll();
};

const clearCanvas = () => {
  if (fCanvas) {
    fCanvas.clear();
    fCanvas.backgroundColor = '#f1f5f9';
    fCanvas.renderAll();
  }
};

// 生命周期绑定
onMounted(() => {
  initCanvas();
  // TODO: 这里您可以去监听 Store 中选中的标签变化，然后调用 renderLabelData(store.currentLabel)
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (fCanvas) fCanvas.dispose();
});
</script>

<style scoped>
/* 隐藏原生默认的高亮轮廓 */
:deep(.canvas-container) {
  outline: none !important;
}
</style>