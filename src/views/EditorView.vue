<template>
  <div class="fixed inset-0 z-[100] bg-[#000000cc] flex items-center justify-center p-8">
    <div
      class="bg-white rounded-2xl shadow-2xl flex flex-col w-full h-full max-w-[1400px] overflow-hidden transform transition-all border border-[#4b55634d]">

      <header
        class="h-[68px] flex items-center justify-between px-6 bg-white border-b border-[#e5e7eb] shrink-0 z-[110]">
        <div
          class="flex items-center gap-2 bg-[#f1f5f9] border border-[#e5e7eb] rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[#dbeafe] transition-shadow w-80">
          <svg viewBox="0 0 100 100" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(1, -7)">
              <g transform="translate(50,50) rotate(-40) translate(-50,-50)">
                <path
                  d="M20,30 h50 a10,10 0 0 1 10,10 v40 a10,10 0 0 1 -10,10 h-50 a10,10 0 0 1 -10,-10 v-40 a10,10 0 0 1 10,-10 z"
                  fill="#1b6Cff" />
                <path d="M55,30 h15 a10,10 0 0 1 10,10 v15 L55,30 z" fill="#ff8a3d" />
                <path d="M55,30 v25 h25 L55,30 z" fill="#1455c0" opacity="0.6" />
              </g>
              <path d="M 25 65 L 45 80 L 85 35" fill="none" stroke="#ff8a3d" stroke-width="10" stroke-linecap="round"
                stroke-linejoin="round" />
            </g>
          </svg>
          <input v-model="store.currentLabel.name"
            class="flex-1 text-[15px] font-bold bg-transparent outline-none text-[#1f2937] placeholder-[#9ca3af]"
            placeholder="未命名标签" />
        </div>
        <div class="flex gap-3">
          <button @click="triggerSaveModal('saveAs')"
            class="btn btn-outline text-[#4b5563] hover:text-[#1677ff] hover:bg-[#eff6ff]"><svg viewBox="0 0 24 24"
              width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>另存为</button>
          <button @click="doExportPDF" class="btn btn-outline text-[#ea580c] hover:bg-[#fff7ed] bg-[#fff7ed]"><svg
              viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>导出模板标签</button>
          <button @click="triggerPdfImport"
            class="btn btn-outline text-[#8b5cf6] hover:bg-[#f5f3ff] bg-[#f5f3ff] flex items-center gap-1"><svg
              viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>合成PDF</button>
          <input type="file" ref="pdfInputRef" accept="application/pdf" class="hidden" @change="handleBatchPDF" />
          <div class="w-px h-6 bg-[#e5e7eb] mt-1.5 mx-1"></div>
          <button @click="triggerSaveModal('save')" :disabled="store.isLoading"
            class="btn bg-[#10b981] text-white hover:bg-[#059669] shadow-md px-6 disabled:opacity-50"><svg
              viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>保存</button>
          <button @click="closeEditor"
            class="btn btn-outline bg-[#f1f5f9] text-[#6b7280] hover:text-[#1f2937] hover:bg-[#e2e8f0] px-4"
            title="关闭画板"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
              stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg></button>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden relative">
        <ComponentLibrary @add-item="handleSidebarClickAdd" />

        <main class="flex-1 flex flex-col relative overflow-hidden bg-[#f3f4f6]">
          <div class="min-h-[58px] bg-white border-b border-[#e5e7eb] flex flex-wrap items-center px-4 gap-2 shrink-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <button @click="openResizeModal" class="btn btn-outline text-xs h-8 px-3 hover:bg-[#eff6ff] hover:text-[#1677ff]"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>修改尺寸</button>
            <div class="w-px h-5 bg-[#d1d5db] mx-1"></div>
            <button @click="addText" class="btn btn-outline text-xs h-8 px-3 hover:text-[#1677ff]"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>添加文本</button>
            <button @click="triggerImageUpload" class="btn btn-outline text-xs h-8 px-3 hover:text-[#1677ff]"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>导入图片</button>
            <input type="file" ref="imageInputRef" accept="image/*" class="hidden" @change="handleImageUpload" />
            <button @click="addLine" class="btn btn-outline text-xs h-8 px-3 hover:text-[#1677ff]"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>添加线条</button>
            <div class="w-px h-5 bg-[#d1d5db] mx-1"></div>

            <button @click="resetBarcode" class="btn text-xs text-[#ea580c] bg-[#fff7ed] border border-transparent hover:bg-[#ffedd5] h-8 px-3"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>复原条码</button>
            <button @click="showCustomBarcodeModal = true" class="btn text-xs text-[#ea580c] bg-[#fff7ed] border border-transparent hover:bg-[#ffedd5] h-8 px-3"><svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" stroke="none"><path d="M3 5h2v14H3V5zm4 0h3v14H7V5zm5 0h2v14h-2V5zm4 0h3v14h-3V5zm5 0h2v14h-2V5z"/></svg>自定义条码</button>

            <div class="ml-auto flex items-center">
              <div v-if="activeElement" class="flex items-center gap-1 transition-all">
                <div v-if="activeElement.type === 'text'" class="flex items-center gap-1 bg-[#f1f5f9] rounded-lg px-1 h-8">
                  <span class="text-[11px] text-[#6b7280] font-bold px-1">字号</span>
                  <button @click="changeFontSize(-1)" class="w-6 h-6 hover:bg-[#e2e8f0] rounded-md font-bold text-[#4b5563] flex items-center justify-center">-</button>
                  <span class="text-[13px] font-mono w-6 text-center font-bold text-[#1677ff]">{{ parseInt(activeElement.fontSize || '24') }}</span>
                  <button @click="changeFontSize(1)" class="w-6 h-6 hover:bg-[#e2e8f0] rounded-md font-bold text-[#4b5563] flex items-center justify-center">+</button>
                  <div class="w-px h-4 bg-[#cbd5e1] mx-1"></div>
                  <button @click="toggleBold" :class="{ 'bg-[#1677ff] text-white': activeElement.fontWeight === 'bold' }" class="w-6 h-6 hover:bg-[#e2e8f0] rounded-md font-bold transition-colors flex items-center justify-center">B</button>
                </div>
                <div v-if="activeElement.type === 'line'" class="flex items-center gap-1 bg-[#f1f5f9] rounded-lg px-1 h-8">
                  <span class="text-[11px] text-[#6b7280] font-bold px-1">长度</span>
                  <input type="number" :value="linePhysicalLength" @change="updateLineLength($event)" class="w-12 bg-white border border-[#d1d5db] rounded outline-none text-center font-mono text-[13px] text-[#1677ff] font-bold py-0.5" />
                  <span class="text-[10px] text-[#9ca3af] font-bold mr-1">mm</span>
                  <div class="w-px h-4 bg-[#cbd5e1] mx-1"></div>
                  <button @click="rotateLine" class="px-2 h-6 hover:bg-[#e2e8f0] rounded-md text-xs font-bold flex items-center gap-1"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>旋转</button>
                </div>
                <div class="w-px h-5 bg-[#e5e7eb] mx-2"></div>
                <button @click="deleteActive" class="btn text-xs text-[#ff4d4f] hover:bg-[#fef2f2] bg-[#fef2f2] border border-transparent h-8 px-3"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> 删除</button>
              </div>
            </div>
          </div>

          <CanvasArea v-model:elements="store.currentLabel.elements" v-model:activeId="activeElementId" :wMM="store.currentLabel.wMM" :hMM="store.currentLabel.hMM" :scale="canvasScale" />

          <div class="absolute bottom-8 left-8 right-8 flex justify-between pointer-events-none z-[120]">
            
            <button @click="openResizeModal" class="pointer-events-auto flex items-center gap-2 bg-white px-4 h-10 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#e5e7eb] hover:shadow-md transition-all text-[#6b7280] text-[13px] font-bold">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#3b82f6" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              画布物理尺寸: 
              <span class="text-[#3b82f6] ml-1 tracking-wider">{{ store.currentLabel.wMM }} × {{ store.currentLabel.hMM }} <span class="text-[11px]">mm</span></span>
            </button>

            <div class="pointer-events-auto flex items-center bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[#e5e7eb] overflow-hidden h-10 px-1">
              <button @click="canvasScale = Math.max(0.1, canvasScale - 0.1)" class="w-8 h-8 rounded-full hover:bg-[#f3f4f6] text-[#4b5563] font-bold flex justify-center items-center transition-colors">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <span class="text-[13px] font-mono w-14 text-center font-bold text-[#3b82f6]">{{ Math.round(canvasScale * 100) }}%</span>
              <button @click="canvasScale = Math.min(3, canvasScale + 0.1)" class="w-8 h-8 rounded-full hover:bg-[#f3f4f6] text-[#4b5563] font-bold flex justify-center items-center transition-colors">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>

    <div v-if="showResizeModal" class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
        <div class="px-6 py-5 bg-[#f9fafb] border-b border-[#e5e7eb]">
          <h3 class="font-extrabold text-[17px] text-[#1f2937] text-center tracking-wide">修改画布尺寸</h3>
        </div>
        <div class="p-8 space-y-6">
          <div
            class="flex items-center gap-4 bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-3 focus-within:border-[#1677ff] focus-within:ring-2 focus-within:ring-[#eff6ff] focus-within:bg-white transition-all">
            <span
              class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">新宽度</span><input
              v-model.number="tempResizeW" type="number" min="10"
              class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center"><span
              class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span></div>
          <div
            class="flex items-center gap-4 bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-3 focus-within:border-[#1677ff] focus-within:ring-2 focus-within:ring-[#eff6ff] focus-within:bg-white transition-all">
            <span
              class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">新高度</span><input
              v-model.number="tempResizeH" type="number" min="10"
              class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center"><span
              class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span></div>
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
          <button @click="showResizeModal = false"
            class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold border-none cursor-pointer">取消</button>
          <button @click="confirmResize"
            class="w-full py-3 rounded-xl bg-[#1677ff] text-white font-bold border-none cursor-pointer">确认修改</button>
        </div>
      </div>
    </div>

    <div v-if="showCustomBarcodeModal"
      class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
        <div class="px-6 py-5 bg-[#fff7ed] border-b border-[#ffedd5]">
          <h3 class="font-extrabold text-[17px] text-[#ea580c] text-center tracking-wide">自定义条码尺寸</h3>
        </div>
        <div class="p-8 space-y-6">
          <div
            class="flex items-center gap-4 bg-[#fffbeb] border border-[#fed7aa] rounded-xl px-4 py-3 focus-within:border-[#ea580c] focus-within:ring-2 focus-within:ring-[#ffedd5] focus-within:bg-white transition-all">
            <span
              class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">条码宽度</span><input
              v-model.number="customBarcodeW" type="number" min="10"
              class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center"><span
              class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span></div>
          <div
            class="flex items-center gap-4 bg-[#fffbeb] border border-[#fed7aa] rounded-xl px-4 py-3 focus-within:border-[#ea580c] focus-within:ring-2 focus-within:ring-[#ffedd5] focus-within:bg-white transition-all">
            <span
              class="text-[15px] font-bold text-[#4b5563] whitespace-nowrap shrink-0 w-20 text-right">条码高度</span><input
              v-model.number="customBarcodeH" type="number" min="10"
              class="flex-1 w-full bg-transparent outline-none text-xl font-mono text-[#1f2937] text-center"><span
              class="text-[15px] font-bold text-[#9ca3af] whitespace-nowrap shrink-0">mm</span></div>
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
          <button @click="showCustomBarcodeModal = false"
            class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold border-none cursor-pointer">取消</button>
          <button @click="confirmCustomBarcode"
            class="w-full py-3 rounded-xl bg-[#ea580c] text-white font-bold border-none cursor-pointer">插入条码</button>
        </div>
      </div>
    </div>

    <div v-if="showSaveModal" class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] px-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
        <div class="px-6 py-5 bg-[#f9fafb] border-b border-[#e5e7eb]">
          <h3 class="font-extrabold text-[17px] text-[#1f2937] text-center tracking-wide">{{ saveActionType === 'saveAs'
            ? '另存为新副本' : '保存标签确认' }}</h3>
        </div>
        <div class="p-8">
          <div
            class="flex items-center gap-4 bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-4 focus-within:border-[#10b981] focus-within:ring-2 focus-within:ring-[#d1fae5] focus-within:bg-white transition-all">
            <input v-model="saveLabelName" type="text" placeholder="请输入标签名称"
              class="flex-1 w-full bg-transparent outline-none text-xl text-[#1f2937] text-center font-bold placeholder-[#9ca3af] placeholder:font-normal">
          </div>
        </div>
        <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
          <button @click="showSaveModal = false"
            class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold text-[15px] border-none cursor-pointer">取消</button>
          <button @click="confirmSaveAction(false)" :disabled="store.isLoading"
            class="w-full py-3 rounded-xl bg-[#10b981] text-white font-bold text-[15px] border-none cursor-pointer">确认保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '../store/useMainStore';
import ComponentLibrary from '../components/ComponentLibrary.vue';
import CanvasArea from '../components/CanvasArea.vue';
import { saveLabel, clearLocalCache } from '../utils/db';
import { exportSinglePDF, exportBatchPDF } from '../utils/pdfExport';
import { cropImageWhitespace } from '../utils/imageCrop';

const store = useMainStore();
const showToast = (msg: string, type = 'info') => (window as any).showToast(msg, type);

const activeElementId = ref<string | null>(null);
const canvasScale = ref(1);
const MM_TO_PX = 3.78;
const ZOOM_FACTOR = 2;
let elementZIndex = 100;

const pdfInputRef = ref<HTMLInputElement | null>(null);
const imageInputRef = ref<HTMLInputElement | null>(null);

const showResizeModal = ref(false);
const tempResizeW = ref(100);
const tempResizeH = ref(100);

const showCustomBarcodeModal = ref(false);
const customBarcodeW = ref(70);
const customBarcodeH = ref(20);

const showSaveModal = ref(false);
const saveActionType = ref<'save' | 'saveAs'>('save');
const saveLabelName = ref('');

const activeElement = computed(() => store.currentLabel.elements.find(el => el.id === activeElementId.value));

const linePhysicalLength = computed(() => {
  if (!activeElement.value || activeElement.value.type !== 'line') return 0;
  const isVert = activeElement.value.isVertical === 'true';
  const px = parseFloat(isVert ? activeElement.value.style.height : activeElement.value.style.width);
  return Math.round(px / (MM_TO_PX * ZOOM_FACTOR));
});

// 🌟 提取干净的数据核心，屏蔽掉拖拽组件偷偷注入的坐标和内部状态
const getCleanData = (label: any) => {
  if (!label) return '';
  return JSON.stringify({
    name: label.name, wMM: label.wMM, hMM: label.hMM,
    elements: label.elements.map((el: any) => ({
      id: el.id, type: el.type, content: el.content, customW: el.customW, customH: el.customH,
      style: { width: el.style?.width, height: el.style?.height, left: el.style?.left, top: el.style?.top }
    }))
  });
};

// 🌟 精准比对：只有用户真实修改了属性，才会拦截
const isCurrentLabelUnsaved = computed(() => {
  if (!store.currentLabel || !store.currentLabel.id) return true;
  const original = store.savedLabels.find(l => l.id === store.currentLabel.id);
  if (!original) return true;
  return getCleanData(original) !== getCleanData(store.currentLabel);
});

// 🌟 恢复完美的按区域自适应算法
function autoFitCanvas() {
  const workspace = document.getElementById('workspace-container') || document.body;
  const availableW = workspace.clientWidth - 100; // 减去的 100 是给四周留出舒适的灰色边距
  const availableH = workspace.clientHeight - 100;
  
  const targetW = store.currentLabel.wMM * MM_TO_PX * ZOOM_FACTOR;
  const targetH = store.currentLabel.hMM * MM_TO_PX * ZOOM_FACTOR;
  
  // 精确计算出恰好能放入工作区的缩放比例
  let scale = Math.min(availableW / targetW, availableH / targetH);
  
  // 不再做过度限制，让它该多大就多大！只保留极值的安全兜底(0.1 ~ 3)
  canvasScale.value = Math.max(0.1, Math.min(scale, 3));
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if (!activeElement.value) return;
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

  if (e.key === 'Delete' || e.key === 'Backspace') { deleteActive(); e.preventDefault(); return; }

  const stepPx = e.shiftKey ? 10 : 1;
  let left = parseFloat(activeElement.value.style.left);
  let top = parseFloat(activeElement.value.style.top);
  let moved = false;

  switch (e.key) {
    case 'ArrowUp': top -= stepPx; moved = true; break;
    case 'ArrowDown': top += stepPx; moved = true; break;
    case 'ArrowLeft': left -= stepPx; moved = true; break;
    case 'ArrowRight': left += stepPx; moved = true; break;
  }
  if (moved) {
    e.preventDefault();
    activeElement.value.style.left = `${Math.max(0, left)}px`;
    activeElement.value.style.top = `${Math.max(0, top)}px`;
  }
}

// 🌟 3. 恢复初始化和重置事件的绑定 (现在不用担心过大了，可以放心地让它自动调整)
onMounted(() => {
  const maxZ = Math.max(0, ...store.currentLabel.elements.map(el => Number(el.style.zIndex) || 0));
  elementZIndex = maxZ + 10;

  window.addEventListener('resize', autoFitCanvas);
  document.addEventListener('keydown', handleGlobalKeydown);
  setTimeout(autoFitCanvas, 100);
});

onUnmounted(() => {
  window.removeEventListener('resize', autoFitCanvas);
  document.removeEventListener('keydown', handleGlobalKeydown);
});


function addText() { store.currentLabel.elements.push({ id: Date.now().toString(), type: 'text', content: '双击修改文本', fontSize: '24px', fontWeight: 'normal', style: { width: '200px', height: 'auto', left: '20px', top: '20px', zIndex: elementZIndex++ } }); }
function addLine() { store.currentLabel.elements.push({ id: Date.now().toString(), type: 'line', isVertical: 'false', style: { width: '150px', height: `${0.2 * MM_TO_PX * ZOOM_FACTOR}px`, left: '20px', top: '20px', zIndex: elementZIndex++ } }); }
function triggerImageUpload() { imageInputRef.value?.click(); }

function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const dataUrl = ev.target?.result as string;
    const cropResult = await cropImageWhitespace(dataUrl);
    const finalH = Math.round(80 * (cropResult.height / cropResult.width));
    store.currentLabel.elements.push({ id: Date.now().toString(), type: 'image', imgUrl: cropResult.url, originalUrl: dataUrl, style: { width: '80px', height: `${finalH}px`, left: '20px', top: '20px', zIndex: elementZIndex++ } });
    if (imageInputRef.value) imageInputRef.value.value = '';
  };
  reader.readAsDataURL(file);
}

function confirmCustomBarcode() {
  if (!customBarcodeW.value || !customBarcodeH.value) return showToast('请输入完整尺寸', 'warning');
  let wPx = customBarcodeW.value * MM_TO_PX * ZOOM_FACTOR;
  let hPx = customBarcodeH.value * MM_TO_PX * ZOOM_FACTOR;
  store.currentLabel.elements.push({ id: Date.now().toString(), type: 'barcode', customW: customBarcodeW.value, customH: customBarcodeH.value, style: { width: `${wPx}px`, height: `${hPx}px`, left: '10px', top: '10px', zIndex: elementZIndex++ } });
  showCustomBarcodeModal.value = false;
}

function resetBarcode() { 
  const barcode = store.currentLabel.elements.find(el => el.type === 'barcode'); 
  
  // 🌟 1. 如果画布中没有条码，直接拦截并提示，不再自动创建
  if (!barcode) {
    return showToast('画布中暂无条码，无法复原', 'warning');
  }

  // 🌟 2. 读取记忆的物理尺寸（没有则默认 70x20）
  const w = barcode.customW || 70; 
  const h = barcode.customH || 20;
  
  const wPx = w * MM_TO_PX * ZOOM_FACTOR;
  const hPx = h * MM_TO_PX * ZOOM_FACTOR;
  const canvasHPx = store.currentLabel.hMM * MM_TO_PX * ZOOM_FACTOR; 
  
  // 🌟 3. 恢复大小，并强制移动到画布最左下角
  barcode.style.width = `${wPx}px`; 
  barcode.style.height = `${hPx}px`;
  barcode.style.left = '0px'; 
  barcode.style.top = `${Math.max(0, canvasHPx - hPx)}px`; 
}

function deleteActive() { if (activeElementId.value) { store.currentLabel.elements = store.currentLabel.elements.filter(el => el.id !== activeElementId.value); activeElementId.value = null; } }

function changeFontSize(delta: number) {
  if (activeElement.value && activeElement.value.type === 'text') {
    let currentSize = parseInt(activeElement.value.fontSize || '24');
    activeElement.value.fontSize = `${Math.max(10, currentSize + delta * 2)}px`;
  }
}

function toggleBold() { if (activeElement.value && activeElement.value.type === 'text') { activeElement.value.fontWeight = activeElement.value.fontWeight === 'bold' ? 'normal' : 'bold'; } }

function updateLineLength(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value);
  if (val && activeElement.value) {
    const newPx = val * MM_TO_PX * ZOOM_FACTOR;
    if (activeElement.value.isVertical === 'true') { activeElement.value.style.height = `${newPx}px`; } else { activeElement.value.style.width = `${newPx}px`; }
  }
}

function rotateLine() {
  if (activeElement.value && activeElement.value.type === 'line') {
    const isVert = activeElement.value.isVertical === 'true';
    const oldW = activeElement.value.style.width; const oldH = activeElement.value.style.height;
    activeElement.value.style.width = oldH; activeElement.value.style.height = oldW;
    activeElement.value.isVertical = isVert ? 'false' : 'true';
  }
}

async function handleSidebarClickAdd(payload: any) {
  let finalImgUrl = payload.imgUrl; let finalW = payload.type === 'text' ? 200 : 80; let finalH = 80;
  if (payload.type === 'image' && finalImgUrl) {
    const cropResult = await cropImageWhitespace(finalImgUrl);
    finalImgUrl = cropResult.url; finalH = Math.round(80 * (cropResult.height / cropResult.width));
  }
  const canvasW = store.currentLabel.wMM * MM_TO_PX * ZOOM_FACTOR; const canvasH = store.currentLabel.hMM * MM_TO_PX * ZOOM_FACTOR;
  store.currentLabel.elements.push({
    id: Date.now().toString(), type: payload.type, content: payload.content, imgUrl: finalImgUrl, originalUrl: payload.imgUrl, fontSize: '24px', fontWeight: 'normal',
    style: { width: `${finalW}px`, height: payload.type === 'text' ? 'auto' : `${finalH}px`, left: `${(canvasW - finalW) / 2}px`, top: `${(canvasH - (payload.type === 'text' ? 30 : finalH)) / 2}px`, zIndex: elementZIndex++ }
  });
}

function openResizeModal() { tempResizeW.value = store.currentLabel.wMM; tempResizeH.value = store.currentLabel.hMM; showResizeModal.value = true; }
function confirmResize() {
  if (!tempResizeW.value || !tempResizeH.value) return showToast('请输入完整尺寸', 'warning');
  store.currentLabel.wMM = tempResizeW.value; store.currentLabel.hMM = tempResizeH.value;
  showResizeModal.value = false; autoFitCanvas(); showToast('尺寸已修改生效', 'success');
}

function triggerSaveModal(type: 'save' | 'saveAs') {
  saveActionType.value = type; const isExisting = store.savedLabels.some(l => l.id === store.currentLabel.id);
  if (type === 'save' && isExisting && store.currentLabel.name.trim() !== '') { confirmSaveAction(true); return; }
  saveLabelName.value = type === 'saveAs' ? (store.currentLabel.name === '新建标签' ? '未命名标签' : store.currentLabel.name) + ' - 副本' : (store.currentLabel.name === '新建标签' ? '未命名标签' : store.currentLabel.name);
  showSaveModal.value = true;
}

async function confirmSaveAction(directSave = false) {
  if (!directSave && !saveLabelName.value.trim()) return showToast('请输入标签名称', 'warning');
  const targetName = directSave ? store.currentLabel.name : saveLabelName.value.trim();
  let isDuplicate = saveActionType.value === 'saveAs' ? store.savedLabels.some(l => l.name === targetName) : store.savedLabels.some(l => l.name === targetName && l.id !== store.currentLabel.id);
  if (isDuplicate) return showToast('该标签名称已存在，请换一个名称', 'warning');
  if (!directSave) showSaveModal.value = false;

  store.showLoading('保存中...'); activeElementId.value = null;
  try {
    if (saveActionType.value === 'saveAs') {
      const newLabel = JSON.parse(JSON.stringify(store.currentLabel)); newLabel.id = Date.now().toString(); newLabel.name = targetName;
      await saveLabel(newLabel); store.currentLabel = newLabel; showToast('已存为新副本！', 'success');
    } else {
      if (!directSave) store.currentLabel.name = targetName;
      await saveLabel(JSON.parse(JSON.stringify(store.currentLabel))); showToast('保存成功', 'success');
    }
    await clearLocalCache(); await store.fetchLabels(); store.setView('dashboard');
  } catch (e: any) { showToast(e.message || '保存失败', 'error'); } finally { store.hideLoading(); }
}

function closeEditor() { activeElementId.value = null; store.setView('dashboard'); }

async function doExportPDF() {
  if (isCurrentLabelUnsaved.value) return showToast('检测到未保存的修改，请先点击【保存】！', 'warning');
  store.showLoading('生成模板标签中...');
  setTimeout(async () => {
    try {
      const canvasEl = document.getElementById('canvas'); const sizerEl = document.getElementById('canvasSizer');
      if (canvasEl && sizerEl) { await exportSinglePDF(canvasEl, sizerEl, store.currentLabel.wMM, store.currentLabel.hMM, store.currentLabel.name || '导出文件'); showToast('导出成功', 'success'); }
    } catch (err) { showToast('导出失败', 'error'); } finally { store.hideLoading(); }
  }, 150);
}

function triggerPdfImport() {
  if (isCurrentLabelUnsaved.value) return showToast('检测到未保存的修改，请先点击【保存】！', 'warning');
  const barcodeEl = store.currentLabel.elements.find(el => el.type === 'barcode');
  if (!barcodeEl) return showToast('请先新增条码进行占位', 'warning');
  pdfInputRef.value?.click();
}

function handleBatchPDF(e: Event) {
  const input = e.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
  if (file.type !== 'application/pdf') { showToast('只能上传 PDF 文件！', 'warning'); return; }
  const barcodeEl = store.currentLabel.elements.find(el => el.type === 'barcode'); if (!barcodeEl) return;

  activeElementId.value = null; store.showLoading('极速合成中...');
  setTimeout(async () => {
    try {
      const canvasEl = document.getElementById('canvas'); const sizerEl = document.getElementById('canvasSizer');
      if (canvasEl && sizerEl) {
        await exportBatchPDF(file, canvasEl, sizerEl, store.currentLabel.wMM, store.currentLabel.hMM, store.currentLabel.name || '导出文件', barcodeEl, (percent, current, total) => { store.showLoading(`正在合成 (${current}/${total})...`); });
        showToast('合成完成！', 'success');
      }
    } catch (err: any) { showToast('请检查文件是否为条码', 'error'); } finally { store.hideLoading(); if (pdfInputRef.value) pdfInputRef.value.value = ''; }
  }, 150);
}

</script>

<style scoped>
@reference "tailwindcss";

.btn {
  @apply flex items-center justify-center gap-1.5 border-none rounded-lg cursor-pointer font-bold transition-all whitespace-nowrap;
}

.btn-outline {
  @apply bg-[#f9fafb] border border-[#e5e7eb] text-[#4b5563] hover:border-[#1677ff] hover:text-[#1677ff] hover:bg-[#eff6ff] px-4 py-2.5 text-[13px] shadow-sm;
}

/* 精准定位画板内的图片，不再误杀左侧组件库的图片！ */
:deep(.canvas-item img),
:deep(.barcode-placeholder img) {
  -webkit-user-drag: none !important;
  user-select: none !important;
  pointer-events: none !important;
}

:deep(.vdr),
:deep(.canvas-item),
:deep([class*="vdr"]) {
  transform: translateZ(0) !important;
  backface-visibility: hidden !important;
  will-change: transform, left, top !important;
  box-shadow: none !important;
}

:deep(.vdr.active:before) {
  display: none !important;
}
</style>