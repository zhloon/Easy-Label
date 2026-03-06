import { defineStore } from 'pinia';
import { getCloudLabels, getLocalThenCloudLabels } from '../utils/db';
import type { LabelData } from '../types';

export const useMainStore = defineStore('main', {
  state: () => ({
    currentView: 'login' as 'login' | 'dashboard' | 'editor',
    savedLabels: [] as LabelData[],
    totalLabels: 0,
    currentLabel: { id: '', name: '新建标签', wMM: 100, hMM: 100, elements: [] } as LabelData,
    isLoading: false,
    loadingText: '加载中...'
  }),
  actions: {
    setView(view: 'login' | 'dashboard' | 'editor') {
      this.currentView = view;
    },
    showLoading(text = '加载中...') {
      this.loadingText = text;
      this.isLoading = true;
    },
    hideLoading() {
      this.isLoading = false;
    },
    // 🌟 增加 preferLocal 参数，用于判断是否优先读取本地缓存
    async fetchLabels(page = 1, pageSize = 10, append = false, preferLocal = false) {
      if (!append) this.showLoading(preferLocal ? '正在读取本地数据...' : '正在同步数据...');
      try {
        // 根据参数决定是强制拉云端，还是优先拉本地
        const data = preferLocal 
            ? await getLocalThenCloudLabels(page, pageSize) 
            : await getCloudLabels(page, pageSize);

        if (append) {
          // 懒加载：追加到底部
          this.savedLabels.push(...data.labels);
        } else {
          // 刷新：直接覆盖
          this.savedLabels = data.labels;
        }
        this.totalLabels = data.total;
      } catch (e: any) {
        console.error('Fetch labels error:', e);
        if (e.message.includes('未绑定') || e.message.includes('失效') || e.message.includes('未授权')) {
          localStorage.removeItem('easy_label_vip_key');
          this.setView('login');
          (window as any).showToast('登录授权已失效，请重新登录', 'error');
        } else {
          (window as any).showToast(e.message || '获取数据失败', 'error');
        }
      } finally {
        if (!append) this.hideLoading();
      }
    }
  }
});