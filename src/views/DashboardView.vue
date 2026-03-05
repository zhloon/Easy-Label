<template>
    <div class="max-w-[1300px] mx-auto p-8 h-full flex flex-col relative z-10 overflow-hidden">
        <header
            class="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm mb-8 border border-[#e5e7eb] shrink-0">
            <h1 class="text-2xl font-extrabold text-[#1f2937] flex items-center gap-2 tracking-wide">
                <svg viewBox="0 0 100 100" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(1, -7)">
                        <g transform="translate(50,50) rotate(-40) translate(-50,-50)">
                            <path
                                d="M20,30 h50 a10,10 0 0 1 10,10 v40 a10,10 0 0 1 -10,10 h-50 a10,10 0 0 1 -10,-10 v-40 a10,10 0 0 1 10,-10 z"
                                fill="#1b6Cff" />
                            <path d="M55,30 h15 a10,10 0 0 1 10,10 v15 L55,30 z" fill="#ff8a3d" />
                            <path d="M55,30 v25 h25 L55,30 z" fill="#1455c0" opacity="0.6" />
                        </g>
                        <path d="M 25 65 L 45 80 L 85 35" fill="none" stroke="#ff8a3d" stroke-width="10"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                </svg>
                易标签 <span class="text-sm font-bold text-[#9ca3af] ml-1 tracking-normal">Easy Label</span>
            </h1>
            <div class="flex gap-3">
                <button @click="refreshPage" :disabled="store.isLoading"
                    class="btn btn-outline text-[#6b7280] hover:text-[#1677ff] hover:bg-[#eff6ff] disabled:opacity-50">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg> 刷新
                </button>
                <div class="w-px h-5 bg-[#e5e7eb] mt-2 mx-1"></div>
                <button @click="showImportShareModal = true" :disabled="store.isLoading"
                    class="btn btn-outline text-[#0284c7] bg-[#f0f9ff] hover:bg-[#e0f2fe] disabled:opacity-50 transition-all hover:-translate-y-0.5 shadow-sm">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                        <rect x="3" y="19" width="18" height="2" rx="1"></rect>
                    </svg>获取分享的模板
                </button>
                <button @click="triggerJsonImport" :disabled="store.isLoading"
                    class="btn btn-outline disabled:opacity-50">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>导入本地库
                </button>
                <button @click="exportJsonLibrary" :disabled="store.isLoading"
                    class="btn btn-outline disabled:opacity-50">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                        stroke-width="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>导出本地库
                </button>
                <input type="file" ref="jsonInputRef" accept=".json" class="hidden" @change="handleJsonImport" />
            </div>
        </header>

        <div class="w-full flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0 flex flex-col">
            <div class="flex justify-between items-center mb-4 border-b-2 border-[#e5e7eb] pb-3 shrink-0">
                <h2 class="text-[17px] font-extrabold text-[#1f2937] tracking-wide">我的标签</h2>
                <button @click="openNewEditor"
                    class="btn bg-gradient-to-r from-[#1677ff] to-[#3b82f6] text-white px-7 py-3 rounded-xl font-extrabold shadow-[0_6px_20px_rgba(22,119,255,0.3)] hover:shadow-[0_8px_25px_rgba(22,119,255,0.45)] hover:-translate-y-0.5 transform transition-all duration-300 flex items-center gap-2 text-[15px] tracking-wide border-none outline-none cursor-pointer">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3"
                        stroke-linecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    新建标签
                </button>
            </div>

            <div v-if="store.savedLabels.length === 0"
                class="w-full py-16 flex flex-col items-center text-[#9ca3af] border-2 border-dashed border-[#d1d5db] rounded-2xl bg-white shadow-sm shrink-0">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"
                    class="mb-4 text-[#d1d5db]">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="font-medium tracking-widest text-sm">暂无保存的标签，请点击上方“新建标签”开始设计</span>
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-1 shrink-0">
                <div v-for="label in store.savedLabels" :key="label.id"
                    class="bg-white border border-[#e5e7eb] rounded-2xl flex flex-col overflow-hidden hover:-translate-y-1.5 hover:border-[#1677ff] hover:shadow-[0_12px_24px_rgba(22,119,255,0.15)] transition-all duration-300 group">

                    <div class="w-full aspect-square cursor-pointer overflow-hidden relative bg-[#f8fafc] flex items-center justify-center p-4"
                        @click="openEditor(label)">
                        <LabelThumbnail :label="label" class="max-w-full max-h-full drop-shadow-sm" />

                        <div
                            class="absolute inset-0 bg-[#0000000d] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span
                                class="bg-[#ffffffeb] text-[#1677ff] text-xs font-bold px-4 py-2 rounded-full shadow-md backdrop-blur-sm tracking-widest flex items-center gap-1 mb-8">点击编辑</span>
                        </div>

                        <div
                            class="absolute bottom-4 left-0 w-full flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[10px] group-hover:translate-y-0 z-20">

                            <button @click.stop="triggerRenameModal(label)"
                                class="relative w-9 h-9 bg-[#ffffffeb] backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.1)] rounded-full flex justify-center items-center text-[#6b7280] hover:text-[#1677ff] hover:bg-white transition-all transform hover:scale-110 active:scale-95 group/btn">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                                    stroke-width="2.5">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                <div
                                    class="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-[#1f2937] text-white text-[11px] px-2 py-1 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                                    重命名</div>
                            </button>

                            <button @click.stop="uploadLabelToCloud(label)" :disabled="store.isLoading"
                                class="relative w-9 h-9 bg-[#ffffffeb] backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.1)] rounded-full flex justify-center items-center text-[#6b7280] hover:text-[#0284c7] hover:bg-white disabled:opacity-50 transition-all transform hover:scale-110 active:scale-95 group/btn">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                                    stroke-width="2.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                <div
                                    class="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-[#1f2937] text-white text-[11px] px-2 py-1 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                                    生成分享码</div>
                            </button>

                            <button @click.stop="triggerDeleteModal(label.id)"
                                class="relative w-9 h-9 bg-[#ffffffeb] backdrop-blur-md shadow-[0_4px_10px_rgba(0,0,0,0.1)] rounded-full flex justify-center items-center text-[#6b7280] hover:text-[#ff4d4f] hover:bg-[#fff1f0] transition-all transform hover:scale-110 active:scale-95 group/btn">
                                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                                    stroke-width="2.5">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path
                                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
                                    </path>
                                </svg>
                                <div
                                    class="absolute -top-9 left-1/2 transform -translate-x-1/2 bg-[#1f2937] text-white text-[11px] px-2 py-1 rounded shadow-lg opacity-0 group-hover/btn:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
                                    删除</div>
                            </button>

                        </div>
                    </div>

                    <div class="py-3 px-4 border-t border-[#f3f4f6] bg-white flex justify-center items-center shrink-0">
                        <div class="font-bold text-[14px] text-center truncate text-[#374151]" :title="label.name">{{
                            label.name }}</div>
                    </div>

                </div>
            </div>

            <div v-if="totalPages > 1" class="flex justify-center items-center gap-3 mt-6 shrink-0">
                <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn">上一页</button>
                <span
                    class="text-[14px] font-bold text-[#6b7280] bg-white px-4 py-1.5 rounded-lg border border-[#e5e7eb] shadow-sm">
                    第 <span class="text-[#1677ff] mx-0.5">{{ currentPage }}</span> / {{ totalPages }} 页
                </span>
                <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages"
                    class="page-btn">下一页</button>
            </div>

            <div class="mt-12 flex justify-between items-center mb-4 border-b-2 border-[#e5e7eb] pb-3 shrink-0">
                <h2 class="text-[17px] font-extrabold text-[#1f2937] tracking-wide">推荐模板 <span
                        class="text-xs text-[#10b981] ml-2 px-2 py-0.5 bg-[#d1fae5] rounded-full border border-[#10b981] tracking-normal">敬请期待</span>
                </h2>
            </div>
            <div
                class="w-full flex-1 min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed border-[#d1d5db] rounded-2xl bg-white/50 shrink-0 mb-8">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5"
                    class="mb-3 text-[#d1d5db]">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="6.5"></line>
                </svg>
                <span class="text-[#9ca3af] font-bold tracking-widest text-sm">海量精美云端模板即将上线，助力快速排版...</span>
            </div>
        </div>

        <div v-if="showRenameModal"
            class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
                <div class="px-6 py-5 bg-[#f9fafb] border-b border-[#e5e7eb]">
                    <h3 class="font-extrabold text-[17px] text-[#1f2937] text-center tracking-wide">重命名标签</h3>
                </div>
                <div class="p-8"><input v-model="renameValue" type="text" placeholder="请输入新名称"
                        class="w-full bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-4 outline-none text-xl text-[#1f2937] text-center font-bold focus:border-[#10b981] transition-all">
                </div>
                <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
                    <button @click="showRenameModal = false"
                        class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold border-none cursor-pointer">取消</button>
                    <button @click="confirmRename" :disabled="store.isLoading"
                        class="w-full py-3 rounded-xl bg-[#10b981] text-white font-bold hover:bg-[#059669] border-none cursor-pointer">确认修改</button>
                </div>
            </div>
        </div>

        <div v-if="showDeleteModal"
            class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[360px] overflow-hidden flex flex-col text-center">
                <div class="p-8">
                    <h3 class="text-xl font-extrabold text-[#1f2937] mb-2">永久删除标签？</h3>
                    <p class="text-sm text-[#6b7280] font-medium">删除后数据将无法恢复，请谨慎操作。</p>
                </div>
                <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
                    <button @click="showDeleteModal = false"
                        class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold border-none cursor-pointer">取消</button>
                    <button @click="confirmDeleteLabel"
                        class="w-full py-3 rounded-xl bg-[#ff4d4f] text-white font-bold border-none cursor-pointer">确认删除</button>
                </div>
            </div>
        </div>

        <div v-if="showImportShareModal"
            class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col">
                <div class="px-6 py-5 bg-[#f0f9ff] border-b border-[#bae6fd]">
                    <h3 class="font-extrabold text-[17px] text-[#0284c7] text-center tracking-wide">获取分享的模板</h3>
                </div>
                <div class="p-8"><input v-model="inputShareCode" type="text" placeholder="请输入6位分享码" maxlength="6"
                        class="w-full bg-[#f8fafc] border border-[#d1d5db] rounded-xl px-4 py-4 outline-none text-xl text-[#1f2937] text-center font-bold focus:border-[#0ea5e9] uppercase transition-all">
                </div>
                <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
                    <button @click="showImportShareModal = false"
                        class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold border-none cursor-pointer">取消</button>
                    <button @click="confirmImportShare" :disabled="store.isLoading"
                        class="w-full py-3 rounded-xl bg-[#0ea5e9] text-white font-bold hover:bg-[#0284c7] border-none cursor-pointer transition-colors">确认获取</button>
                </div>
            </div>
        </div>

        <div v-if="showShareResultModal"
            class="fixed inset-0 bg-[#00000099] flex items-center justify-center z-[2000] backdrop-blur-sm px-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden flex flex-col text-center">
                <div class="p-8">
                    <div
                        class="w-16 h-16 bg-[#d1fae5] text-[#10b981] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor"
                            stroke-width="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h3 class="text-xl font-extrabold text-[#1f2937] mb-2">生成分享码成功</h3>
                    <p class="text-sm text-[#6b7280] font-medium mb-6">您的朋友可以通过此分享码获取该模板</p>
                    <div
                        class="bg-[#f8fafc] border-2 border-dashed border-[#cbd5e1] rounded-xl py-4 text-3xl font-black text-[#1677ff] tracking-[0.2em] mb-2 select-all">
                        {{ displayShareCode }}</div>
                </div>
                <div class="px-6 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] grid grid-cols-2 gap-4">
                    <button @click="showShareResultModal = false"
                        class="w-full py-3 rounded-xl bg-[#e2e8f0] text-[#4b5563] font-bold border-none cursor-pointer">关闭</button>
                    <button @click="copyShareCode"
                        class="w-full py-3 rounded-xl bg-[#1677ff] text-white font-bold hover:bg-[#1055c0] border-none cursor-pointer transition-colors">复制分享码</button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMainStore } from '../store/useMainStore';
import { clearLocalCache, getAllLabels, saveLabel, deleteLabel, clearAndImportDB } from '../utils/db';
import type { LabelData } from '../types';
import { apiClient } from '../api';
import LabelThumbnail from '../components/LabelThumbnail.vue';

const store = useMainStore();

// ==========================================
// 分页状态
// ==========================================
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(store.totalLabels / 15) || 1);

onMounted(async () => {
    if (store.currentView === 'dashboard' && store.savedLabels.length === 0) {
        await store.fetchLabels(1, 15);
    }
});

async function refreshPage() {
    await store.fetchLabels(1, 15);
    (window as any).showToast('数据已同步', 'success');
}

async function changePage(page: number) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    await store.fetchLabels(page, 15);
}

// ==========================================
// 编辑与增删改
// ==========================================
function openEditor(label: LabelData) {
    store.currentLabel = JSON.parse(JSON.stringify(label));
    store.setView('editor');
}

function openNewEditor() {
    store.currentLabel = { id: Date.now().toString(), name: '新建标签', wMM: 100, hMM: 100, elements: [] };
    store.setView('editor');
}

const showRenameModal = ref(false);
const renameValue = ref('');
const activeLabel = ref<LabelData | null>(null);
const showDeleteModal = ref(false);
const deleteTargetId = ref('');

function triggerRenameModal(label: LabelData) {
    activeLabel.value = label; renameValue.value = label.name; showRenameModal.value = true;
}
function triggerDeleteModal(id: string) {
    deleteTargetId.value = id; showDeleteModal.value = true;
}

async function confirmRename() {
    if (!renameValue.value.trim() || !activeLabel.value) return (window as any).showToast('请输入有效名称', 'warning');
    const isDuplicate = store.savedLabels.some(l => l.name === renameValue.value.trim() && l.id !== activeLabel.value!.id);
    if (isDuplicate) return (window as any).showToast('该模板名称已存在', 'warning');

    store.showLoading('正在重命名...');
    try {
        const rawLabel = JSON.parse(JSON.stringify(activeLabel.value));
        rawLabel.name = renameValue.value.trim();
        await saveLabel(rawLabel);
        await store.fetchLabels(currentPage.value, 15);
        showRenameModal.value = false;
        (window as any).showToast('重命名成功', 'success');
    } catch (e: any) { (window as any).showToast(e.message, 'error'); } finally { store.hideLoading(); }
}

async function confirmDeleteLabel() {
    store.showLoading('正在删除...');
    try {
        await deleteLabel(deleteTargetId.value);
        await store.fetchLabels(currentPage.value, 15);
        showDeleteModal.value = false;
        (window as any).showToast('已永久删除', 'success');
    } catch (e: any) { (window as any).showToast(e.message, 'error'); } finally { store.hideLoading(); }
}

// ==========================================
// 🌟 分享与提取功能 (Mock API，接入后端时替换)
// ==========================================
const showImportShareModal = ref(false);
const inputShareCode = ref('');
const showShareResultModal = ref(false);
const displayShareCode = ref('');

// 1. 生成分享码 (POST 请求)
async function uploadLabelToCloud(label: LabelData) {
    store.showLoading('生成分享码中...');
    try {
        // 彻底洗白 Proxy，提取纯净的 JSON 数据发给后端
        const rawLabel = JSON.parse(JSON.stringify(label));

        // 发送 POST 请求到后端
        const res: any = await apiClient.post('/api/share', rawLabel);

        if (!res.success) {
            throw new Error(res.error || '生成分享码失败');
        }

        displayShareCode.value = res.shareCode;
        showShareResultModal.value = true;
        (window as any).showToast('云端分享成功', 'success');
    } catch (e: any) {
        (window as any).showToast(e.message || '分享失败，请检查网络', 'error');
    } finally {
        store.hideLoading();
    }
}

// 2. 复制分享码
function copyShareCode() {
    navigator.clipboard.writeText(displayShareCode.value);
    (window as any).showToast('分享码已复制到剪贴板', 'success');
}

// 3. 提取分享码 (GET 请求)
async function confirmImportShare() {
    const code = inputShareCode.value.trim().toUpperCase();
    if (!code || code.length !== 6) {
        return (window as any).showToast('请输入有效的 6 位分享码', 'warning');
    }

    store.showLoading('正在获取云端模板...');
    try {
        // 发起 GET 请求 (使用相对路径，Vite/Nginx 代理会自动转发到后端)
        const response = await fetch(`/api/share/${code}`);
        const res = await response.json();

        if (!response.ok || !res.success) {
            throw new Error(res.error || '获取失败，分享码无效或已过期');
        }

        const sharedLabel = res.labelData;

        // 🌟 核心防冲突机制：给别人分享来的模板赋予一个新的独立 ID！
        // 避免和本地原有的模板 ID 冲突导致覆盖，同时加上后缀方便区分
        sharedLabel.id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
        sharedLabel.name = sharedLabel.name + ' (分享导入)';

        // 调用现成的 db 方法存入个人数据库
        await saveLabel(sharedLabel);

        (window as any).showToast('获取成功，已存入您的标签库', 'success');
        showImportShareModal.value = false;
        inputShareCode.value = '';

        // 刷新列表以展示最新获取的模板
        await store.fetchLabels(1, 15);
    } catch (e: any) {
        (window as any).showToast(e.message || '获取失败，请检查分享码是否正确', 'error');
    } finally {
        store.hideLoading();
    }
}

// ==========================================
// 本地 JSON 导入导出
// ==========================================
const jsonInputRef = ref<HTMLInputElement | null>(null);

function exportJsonLibrary() {
    if (store.savedLabels.length === 0) return (window as any).showToast('当前模板库为空，无法导出', 'warning');
    const dataStr = JSON.stringify(store.savedLabels, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.download = `易标签_本地备份_${new Date().toLocaleDateString().replace(/\//g, '')}.json`;
    link.click(); URL.revokeObjectURL(url);
    (window as any).showToast('本地库导出成功', 'success');
}

function triggerJsonImport() { jsonInputRef.value?.click(); }

function handleJsonImport(e: Event) {
    const input = e.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const data = JSON.parse(ev.target?.result as string);
            if (!Array.isArray(data)) throw new Error('JSON 格式错误');
            store.showLoading('正在解析并导入本地库...');
            await clearAndImportDB(data);
            await store.fetchLabels(1, 15);
            (window as any).showToast('本地库导入成功！', 'success');
        } catch (err) { (window as any).showToast('文件解析失败', 'error'); } finally { store.hideLoading(); if (jsonInputRef.value) jsonInputRef.value.value = ''; }
    };
    reader.readAsText(file);
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

/* 🌟 卡片操作按钮加入极致微动效：Hover 变大一点，按下缩小一点 */
.card-action-btn {
    @apply flex-1 py-2 bg-[#f1f5f9] text-[#6b7280] rounded-lg transition-all duration-200 flex justify-center items-center border-none cursor-pointer transform hover:scale-110 active:scale-95;
}

.page-btn {
    @apply px-4 py-2 rounded-lg bg-white border border-[#e5e7eb] text-[#4b5563] hover:bg-[#eff6ff] hover:text-[#1677ff] disabled:opacity-40 transition-all font-bold text-[13px] shadow-sm border-none cursor-pointer;
}
</style>