import { defineStore } from 'pinia';
// 🌟 核心修改 1：引入 getCloudLabels
import { getLocalLabelsPaginated, getLocalThenCloudLabels, getCloudLabels } from '../utils/db';
import type { LabelData } from '../types';

interface MainState {
  currentView: 'login' | 'dashboard' | 'editor';
  savedLabels: LabelData[];
  totalLabels: number;
  currentLabel: LabelData;
  isLoading: boolean;
  loadingText: string;
  currentPlatform: string; 
}

export const useMainStore = defineStore('main', {
  state: (): MainState => ({
    currentView: 'login',
    savedLabels: [],
    totalLabels: 0,
    currentLabel: {} as LabelData,
    isLoading: false,
    loadingText: '',
    currentPlatform: 'TEMU', 
  }),
  actions: {
      setView(view: 'login' | 'dashboard' | 'editor') {
        this.currentView = view;
      },
      showLoading(text = '处理中...') {
        this.isLoading = true;
        this.loadingText = text;
      },
      hideLoading() {
        this.isLoading = false;
        this.loadingText = '';
      },
    // 🌟 核心修改 2：新增第5个参数 forceCloud
    async fetchLabels(page = 1, pageSize = 10, forceLocal = false, skipLoading = false, forceCloud = false) {
      if (!skipLoading) this.showLoading('加载中...');
      try {
        const platform = this.currentPlatform; 
        let res;
        
        if (forceCloud) {
          // 🚀 如果开启了 forceCloud，直接强制从云端获取数据，底层会自动覆盖本地对应的标签
          res = await getCloudLabels(page, pageSize, platform);
        } else if (forceLocal) {
          res = await getLocalLabelsPaginated(page, pageSize, platform);
        } else {
          res = await getLocalThenCloudLabels(page, pageSize, platform);
        }
        
        this.savedLabels = res.labels || [];
        this.totalLabels = res.total || 0;
      } catch (err) {
        console.error('获取标签失败', err);
      } finally {
        if (!skipLoading) this.hideLoading();
      }
    }
  }
});