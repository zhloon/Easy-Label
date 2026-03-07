<template>
  <div class="flex-1 overflow-auto relative canvas-bg bg-slate-50" id="workspace-container" @mousedown="clearActive"
    @dragover.prevent @dragenter.prevent @drop.prevent="handleDrop">
    <div class="min-w-full min-h-full flex p-10">
      
      <div id="canvasSizer" class="relative shrink-0 transition-all duration-150 m-auto"
        :style="{ width: `${wMM * MM_TO_PX * ZOOM_FACTOR * scale}px`, height: `${hMM * MM_TO_PX * ZOOM_FACTOR * scale}px` }">
        
        <div id="canvasWrapper" class="absolute top-0 left-0 origin-top-left transition-transform duration-150"
          :style="{ transform: `scale(${scale})` }">

          <div id="canvas" class="relative bg-white shadow-[0_12px_30px_rgba(0,0,0,0.15)] overflow-hidden ring-1 ring-slate-200"
            :style="{ width: `${wMM * MM_TO_PX * ZOOM_FACTOR}px`, height: `${hMM * MM_TO_PX * ZOOM_FACTOR}px` }">

            <div v-for="el in elements" :key="el.id" :id="'el-' + el.id"
              class="absolute cursor-move box-border select-none group"
              :class="[
                activeId === el.id && editingId !== el.id ? 'ring-2 ring-primary-500 ring-offset-0 z-[100]' : 'ring-1 ring-transparent hover:ring-slate-300 hover:ring-dashed',
                el.type === 'line' ? 'before:absolute before:-inset-3 before:content-[\'\']' : ''
              ]"
              :style="{ width: el.style.width, height: el.style.height, left: el.style.left, top: el.style.top, zIndex: el.style.zIndex }"
              @mousedown.stop="startDrag($event, el)">

              <div v-if="el.type === 'text'" :contenteditable="editingId === el.id"
                @dblclick.stop="startEditing(el.id, $event)" @blur="finishEditing($event, el)"
                class="w-full h-full whitespace-pre-wrap break-words outline-none leading-snug text-slate-900"
                :class="{ 'cursor-text': editingId === el.id }"
                :style="{ fontSize: el.fontSize, fontWeight: el.fontWeight }">{{ el.content }}</div>

              <img v-else-if="el.type === 'image'" :src="el.imgUrl || el.originalUrl"
                class="w-full h-full object-contain pointer-events-none" draggable="false" />

              <div v-else-if="el.type === 'barcode'"
                class="w-full h-full bg-white border border-slate-900 flex flex-col items-center justify-center overflow-hidden p-1">
                <div class="w-[80%] h-[45%] bg-slate-900 mt-1"></div>
                <span
                  class="text-[11px] mt-1 text-danger font-bold text-center leading-tight tracking-wider">占位条码</span>
              </div>

              <div v-else-if="el.type === 'line'" class="w-full h-full bg-slate-900 pointer-events-none"></div>

              <div v-if="activeId === el.id && editingId !== el.id">
                <template v-if="['image', 'barcode', 'text'].includes(el.type)">
                  <div class="resizer nw" @mousedown.stop="startResize($event, el, 'nw')"></div>
                  <div class="resizer ne" @mousedown.stop="startResize($event, el, 'ne')"></div>
                  <div class="resizer sw" @mousedown.stop="startResize($event, el, 'sw')"></div>
                  <div class="resizer se" @mousedown.stop="startResize($event, el, 'se')"></div>
                  <div v-if="el.type === 'text'" class="resizer w" @mousedown.stop="startResize($event, el, 'w')"></div>
                  <div v-if="el.type === 'text'" class="resizer e" @mousedown.stop="startResize($event, el, 'e')"></div>
                  <div v-if="el.type === 'text'" class="resizer n" @mousedown.stop="startResize($event, el, 'n')"></div>
                  <div v-if="el.type === 'text'" class="resizer s" @mousedown.stop="startResize($event, el, 's')"></div>
                </template>
                <template v-else-if="el.type === 'line'">
                  <div v-if="String(el.isVertical) === 'true'" class="resizer n" @mousedown.stop="startResize($event, el, 'n')"></div>
                  <div v-if="String(el.isVertical) === 'true'" class="resizer s" @mousedown.stop="startResize($event, el, 's')"></div>
                  <div v-if="String(el.isVertical) !== 'true'" class="resizer w" @mousedown.stop="startResize($event, el, 'w')"></div>
                  <div v-if="String(el.isVertical) !== 'true'" class="resizer e" @mousedown.stop="startResize($event, el, 'e')"></div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { LabelElement } from '../types';
import { cropImageWhitespace } from '../utils/imageCrop';

const props = defineProps<{ wMM: number; hMM: number; scale: number; }>();

const elements = defineModel<LabelElement[]>('elements', { required: true });
const activeId = defineModel<string | null>('activeId', { required: true });

const editingId = ref<string | null>(null);
const MM_TO_PX = 3.78;
const ZOOM_FACTOR = 2;

function clearActive() {
  activeId.value = null;
  editingId.value = null;
}

function startEditing(id: string, e: MouseEvent) {
  editingId.value = id;
  activeId.value = id;
  setTimeout(() => { (e.target as HTMLElement).focus(); }, 0);
}

function finishEditing(e: FocusEvent, el: LabelElement) {
  el.content = (e.target as HTMLElement).innerText;
  editingId.value = null;

  // 🌟 修复点1：如果用户打字变多了导致换行，自动撑大外框防止文字溢出！
  setTimeout(() => {
    const domNode = document.getElementById(`el-${el.id}`);
    if (domNode) {
      const textChild = domNode.firstElementChild as HTMLElement;
      const currentH = parseFloat(el.style.height) || domNode.offsetHeight;
      if (textChild && textChild.scrollHeight > currentH) {
        el.style.height = `${textChild.scrollHeight}px`;
      }
    }
  }, 0);
}

async function handleDrop(e: DragEvent) {
  const dataStr = e.dataTransfer?.getData('text/plain');
  if (dataStr) {
    const payload = JSON.parse(dataStr);
    const canvasRect = document.getElementById('canvas')?.getBoundingClientRect();
    if (!canvasRect) return;
    const logicLeft = (e.clientX - canvasRect.left) / props.scale;
    const logicTop = (e.clientY - canvasRect.top) / props.scale;

    let finalImgUrl = payload.imgUrl;
    let finalW = payload.type === 'text' ? 200 : 80;
    let finalH = 80;

    if (payload.type === 'image' && finalImgUrl) {
      const cropResult = await cropImageWhitespace(finalImgUrl);
      finalImgUrl = cropResult.url;
      finalH = Math.round(80 * (cropResult.height / cropResult.width));
    }

    elements.value.push({
      id: Date.now().toString(), type: payload.type, content: payload.content, imgUrl: finalImgUrl, originalUrl: payload.imgUrl, fontSize: '24px', fontWeight: 'normal',
      style: { width: `${finalW}px`, height: payload.type === 'text' ? 'auto' : `${finalH}px`, left: `${logicLeft}px`, top: `${logicTop}px`, zIndex: 10 }
    });
  }
}

function startDrag(e: MouseEvent, el: LabelElement) {
  if (e.button !== 0 || editingId.value === el.id) return;
  activeId.value = el.id;
  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = parseFloat(el.style.left);
  const startTop = parseFloat(el.style.top);
  const canvasW = props.wMM * MM_TO_PX * ZOOM_FACTOR;
  const canvasH = props.hMM * MM_TO_PX * ZOOM_FACTOR;

  const onMouseMove = (ev: MouseEvent) => {
    const dx = (ev.clientX - startX) / props.scale;
    const dy = (ev.clientY - startY) / props.scale;
    const domNode = document.getElementById(`el-${el.id}`);
    const elW = domNode ? domNode.offsetWidth : parseFloat(el.style.width) || 50;
    const elH = domNode ? domNode.offsetHeight : parseFloat(el.style.height) || 50;

    const maxLeft = Math.max(0, canvasW - elW);
    const maxTop = Math.max(0, canvasH - elH);
    el.style.left = `${Math.max(0, Math.min(startLeft + dx, maxLeft))}px`;
    el.style.top = `${Math.max(0, Math.min(startTop + dy, maxTop))}px`;
  };
  const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
  document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
}

function startResize(e: MouseEvent, el: LabelElement, dir: string) {
  e.stopPropagation();
  const domNode = document.getElementById(`el-${el.id}`);
  const startX = e.clientX; const startY = e.clientY;
  
  // 兼容 auto 获取真实宽高
  const startW = parseFloat(el.style.width) || domNode?.offsetWidth || 15;
  const startH = parseFloat(el.style.height) || domNode?.offsetHeight || 15;
  
  const startLeft = parseFloat(el.style.left); const startTop = parseFloat(el.style.top);
  const ratio = startW / startH;

  const onMouseMove = (ev: MouseEvent) => {
    const dx = (ev.clientX - startX) / props.scale; const dy = (ev.clientY - startY) / props.scale;
    let newW = startW; let newH = startH; let newL = startLeft; let newT = startTop;

    if (dir.includes('e')) newW = startW + dx;
    if (dir.includes('w')) { newW = startW - dx; newL = startLeft + dx; }
    if (dir.includes('s')) newH = startH + dy;
    if (dir.includes('n')) { newH = startH - dy; newT = startTop + dy; }

    const isVert = String(el.isVertical) === 'true';
    let minW = (el.type === 'line' && isVert) ? 1 : 15;
    let minH = (el.type === 'line' && !isVert) ? 1 : 15;

    if (newW < minW) { newW = minW; if (dir.includes('w')) newL = startLeft + startW - minW; }
    if (newH < minH) { newH = minH; if (dir.includes('n')) newT = startTop + startH - minH; }

    if (['image', 'barcode'].includes(el.type)) {
      if (dir === 'se' || dir === 'e' || dir === 's') { newH = newW / ratio; }
      else if (dir === 'sw' || dir === 'w') { newH = newW / ratio; }
      else if (dir === 'ne' || dir === 'n') { newH = newW / ratio; newT = startTop + startH - newH; }
      else if (dir === 'nw') { newH = newW / ratio; newT = startTop + startH - newH; }
    }

    if (el.type === 'line') {
      const thickPx = 0.2 * MM_TO_PX * ZOOM_FACTOR;
      if (isVert) { newW = thickPx; } else { newH = thickPx; }
    }

    // ==========================================
    // 🌟 修复点2：精准阻止文本框被拉扯到小于文字！
    // ==========================================
    // ==========================================
    // 🌟 修复点2：精准阻止文本框被拉扯到小于文字，同时完美支持缩小多余空白！
    // ==========================================
    if (el.type === 'text' && domNode) {
      const textChild = domNode.firstElementChild as HTMLElement;
      if (textChild) {
        // 1. 临时保存原有高度，并强制设为 auto 解除 h-full 的束缚
        const oldChildH = textChild.style.height;
        const oldNodeH = domNode.style.height;
        textChild.style.height = 'auto';
        domNode.style.height = 'auto';
        
        // 2. 将临时 DOM 宽度设为新宽度，让浏览器瞬间重新排版
        domNode.style.width = `${newW}px`;
        
        // 3. 此时测算出来的才是文字纯天然、最真实的所需高度！
        const realMinH = textChild.scrollHeight;
        
        // 4. 测完之后立刻恢复原有状态（速度极快，肉眼不可见）
        textChild.style.height = oldChildH;
        domNode.style.height = oldNodeH;
        
        // 5. 如果用户拖拽的高度小于文字实际需要的高度，强制托底保护
        if (newH < realMinH) {
          newH = realMinH;
          // 如果是往上拖拽，还需要同步修正 Top 坐标防止组件往上瞬移漂移
          if (dir.includes('n')) newT = startTop + startH - realMinH;
        }
      }
    }

    el.style.width = `${newW}px`; el.style.height = `${newH}px`; el.style.left = `${newL}px`; el.style.top = `${newT}px`;
  };
  const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
  document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp);
}
</script>

<style scoped>
@reference "tailwindcss";

.resizer {
  @apply absolute w-2.5 h-2.5 bg-[#1677ff] border-[1.5px] border-white rounded-full shadow-md z-[110];
}

.resizer.nw { top: -5px; left: -5px; cursor: nwse-resize; }
.resizer.ne { top: -5px; right: -5px; cursor: nesw-resize; }
.resizer.sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
.resizer.se { bottom: -5px; right: -5px; cursor: nwse-resize; }
.resizer.w { top: calc(50% - 5px); left: -5px; cursor: ew-resize; }
.resizer.e { top: calc(50% - 5px); right: -5px; cursor: ew-resize; }
.resizer.n { top: -5px; left: calc(50% - 5px); cursor: ns-resize; }
.resizer.s { bottom: -5px; left: calc(50% - 5px); cursor: ns-resize; }
</style>