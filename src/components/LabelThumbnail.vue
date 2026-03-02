<template>
  <div class="relative w-full h-full overflow-hidden bg-[#e5e7eb] flex items-center justify-center" ref="containerRef">
    <div 
      class="absolute origin-top-left bg-white shadow-sm"
      :style="{
        width: `${label.wMM * MM_TO_PX * ZOOM_FACTOR}px`,
        height: `${label.hMM * MM_TO_PX * ZOOM_FACTOR}px`,
        transform: `scale(${scale})`,
        left: `${offsetX}px`,
        top: `${offsetY}px`
      }"
    >
      <div
        v-for="el in label.elements"
        :key="el.id"
        class="absolute box-border"
        :style="{ width: el.style.width, height: el.style.height, left: el.style.left, top: el.style.top }"
      >
        <div v-if="el.type === 'text'" class="w-full h-auto whitespace-pre-wrap break-words leading-snug text-black" :style="{ fontSize: el.fontSize, fontWeight: el.fontWeight }">
          {{ el.content }}
        </div>
        <img v-else-if="el.type === 'image'" :src="el.imgUrl || el.originalUrl" class="w-full h-full object-contain" />
        <div v-else-if="el.type === 'barcode'" class="w-full h-full bg-white border border-black flex items-center justify-center p-1">
          <div class="w-[80%] h-[45%] bg-black"></div>
        </div>
        <div v-else-if="el.type === 'line'" class="w-full h-full bg-black"></div>
        <div v-else-if="el.type === 'rect'" class="w-full h-full border border-black bg-transparent"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { LabelData } from '../types';

const props = defineProps<{ label: LabelData }>();

const MM_TO_PX = 3.78;
const ZOOM_FACTOR = 2;

const containerRef = ref<HTMLElement | null>(null);
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);

function calculateScale() {
  if (!containerRef.value) return;
  const containerW = containerRef.value.clientWidth;
  const containerH = containerRef.value.clientHeight;
  const canvasW = props.label.wMM * MM_TO_PX * ZOOM_FACTOR;
  const canvasH = props.label.hMM * MM_TO_PX * ZOOM_FACTOR;

  // 计算完美填充比例 (留 5% 边距)
  scale.value = Math.min(containerW / canvasW, containerH / canvasH) * 0.95;
  
  // 居中偏移量
  offsetX.value = (containerW - canvasW * scale.value) / 2;
  offsetY.value = (containerH - canvasH * scale.value) / 2;
}

onMounted(() => {
  // 稍微延迟确保 DOM 已渲染
  setTimeout(calculateScale, 50);
});

watch(() => props.label, calculateScale, { deep: true });
</script>