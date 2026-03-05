import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LabelData } from '../types';
import { getAllLabels } from '../utils/db';

// 🌟 使用 Vue3 Setup 语法糖风格定义 Store
export const useMainStore = defineStore('main', () => {
    // 1. 全局视图与状态
    const currentView = ref<'login' | 'dashboard' | 'editor'>('login');
    const isLoading = ref(false);
    const loadingText = ref('处理中...');

    // 2. 核心数据
    const savedLabels = ref<LabelData[]>([]);
    const totalLabels = ref(0); // 🌟 新增：保存标签总数，用于分页计算
    const currentLabel = ref<LabelData>({ id: '', name: '', wMM: 100, hMM: 100, elements: [] });

    // 3. 全局弹窗控制
    const showShareResultModal = ref(false);
    const displayShareCode = ref('');

    // 4. 核心通用动作 (Actions)
    const setView = (view: 'login' | 'dashboard' | 'editor') => {
        currentView.value = view;
    };

    const showLoading = (text: string = '处理中...') => {
        loadingText.value = text;
        isLoading.value = true;
    };

    const hideLoading = () => {
        isLoading.value = false;
    };

    // 刷新标签库
    const fetchLabels = async (page = 1, pageSize = 15) => {
        showLoading('正在加载模板库...');
        try {
            const result = await getAllLabels(page, pageSize);
            savedLabels.value = result.labels;
            totalLabels.value = result.total; // 🌟 新增：更新总数
            return result;
        } catch (error) {
            console.error('获取标签失败', error);
            return { labels: [], total: 0 };
        } finally {
            hideLoading();
        }
    };

    return {
        // 🌟 必须在这里暴露 totalLabels，组件里才不会报红！
        currentView, isLoading, loadingText, savedLabels, currentLabel, totalLabels, showShareResultModal, displayShareCode,
        
        setView, showLoading, hideLoading, fetchLabels
    };
});