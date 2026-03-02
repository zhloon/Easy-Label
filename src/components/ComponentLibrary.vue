<template>
  <aside class="flex flex-col h-full bg-white border-r border-gray-200 w-[280px] shrink-0 z-20 shadow-sm relative">
    <div class="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
      <input v-model="searchQuery" type="text" placeholder="搜索图标或警示语..." class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1677ff] focus:ring-1 focus:ring-[#1677ff] transition-all">
    </div>

    <div class="flex-1 overflow-y-auto custom-scrollbar pb-10">
      <div v-if="isLoading" class="p-6 text-center text-sm text-gray-400">组件库加载中...</div>
      
      <div v-for="(category, catIndex) in filteredLibrary" :key="catIndex" class="mb-2">
        <div class="px-4 py-3 bg-gray-100 border-b border-gray-200 border-l-4 border-l-[#1677ff] font-extrabold text-sm text-gray-800 sticky top-0 z-10 shadow-sm">
          {{ category.parentTitle }}
        </div>
        
        <div v-for="(group, grpIndex) in category.groups" :key="grpIndex">
          <div class="flex justify-between items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors" @click="toggleGroup(group.groupTitle)">
            <span>{{ group.groupTitle }} ({{ group.items.length }})</span>
            <svg :class="{'rotate-[-90deg]': !expandedGroups.has(group.groupTitle)}" class="w-3.5 h-3.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          
          <ul v-show="expandedGroups.has(group.groupTitle)">
            <li v-for="(item, idx) in group.items" :key="idx" class="border-b border-gray-50 hover:bg-blue-50 transition-colors">
              <div class="flex justify-between items-center px-4 py-3 cursor-pointer" @click="toggleItem(item.name)">
                <div class="flex flex-col select-none pointer-events-none">
                  <span class="text-[13px] font-medium text-gray-800">{{ item.name }}</span>
                  <span v-if="item.sub" class="text-[11px] text-gray-500 mt-1 line-clamp-1">{{ item.sub }}</span>
                </div>
                <svg :class="{'rotate-180 text-[#1677ff]': expandedItems.has(item.name)}" class="w-4 h-4 text-gray-400 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              
              <div v-if="expandedItems.has(item.name)" class="px-4 py-3 bg-gray-50 border-t border-dashed border-gray-200">
                <img v-if="item.type === 'image' || item.type === 'image_text'" :src="item.img" class="max-w-[140px] max-h-[80px] object-contain mb-2 cursor-pointer hover:ring-2 hover:ring-[#1677ff] rounded shadow-sm bg-white p-1" draggable="true" @dragstart="onDragStart($event, { ...item, type: 'image' })" @click="onItemClick(item, 'image')" title="点击或拖拽加入画布" />
                <div v-if="item.type === 'text' || item.type === 'image_text'" class="whitespace-pre-wrap break-words p-2 bg-white border border-gray-200 rounded text-xs text-gray-800 font-medium cursor-pointer hover:ring-2 hover:ring-[#1677ff] shadow-sm" draggable="true" @dragstart="onDragStart($event, { ...item, type: 'text' })" @click="onItemClick(item, 'text')" title="点击或拖拽加入画布">{{ item.content }}</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { loadLibraryData } from '../utils/libraryData';
import type { ComponentCategory } from '../types';

const emit = defineEmits(['add-item']);

const libraryData = ref<ComponentCategory[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const expandedGroups = ref<Set<string>>(new Set());
const expandedItems = ref<Set<string>>(new Set());

onMounted(async () => {
  libraryData.value = await loadLibraryData();
  isLoading.value = false;
});

const filteredLibrary = computed(() => {
  if (!searchQuery.value.trim()) return libraryData.value;
  const term = searchQuery.value.toLowerCase();
  return libraryData.value.map(cat => {
    const newGroups = cat.groups.map(grp => {
      const filteredItems = grp.items.filter(item => 
        item.name.toLowerCase().includes(term) || 
        (item.sub && item.sub.toLowerCase().includes(term)) ||
        (item.content && item.content.toLowerCase().includes(term))
      );
      return { ...grp, items: filteredItems };
    }).filter(grp => grp.items.length > 0);
    return { ...cat, groups: newGroups };
  }).filter(cat => cat.groups.length > 0);
});

function toggleGroup(title: string) { expandedGroups.value.has(title) ? expandedGroups.value.delete(title) : expandedGroups.value.add(title); }
function toggleItem(name: string) { expandedItems.value.has(name) ? expandedItems.value.delete(name) : expandedItems.value.add(name); }

function onDragStart(e: DragEvent, item: any) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: item.type, imgUrl: item.img || '', content: item.content || '' }));
    e.dataTransfer.effectAllowed = 'copy';
  }
}

// 触发点击加入
function onItemClick(item: any, type: string) {
  emit('add-item', { type, imgUrl: item.img || '', content: item.content || '' });
}
</script>