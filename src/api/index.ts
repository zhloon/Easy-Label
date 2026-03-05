import axios from 'axios';
import type { LabelData } from '../types';

const BASE_URL = 'https://easylabel.cloud'; 

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('❌ [Vue API Error]', error);
    const msg = error.response?.data?.error || error.message || '网络请求异常';
    return Promise.reject(new Error(msg));
  }
);

export const api = {
  createShareCode(labelData: LabelData) {
    // 🌟 统一加上 /api 前缀
    return apiClient.post('/api/share', labelData);
  },
  getSharedLabel(shareCode: string) {
    // 🌟 统一加上 /api 前缀
    return apiClient.get(`/api/share/${shareCode}`);
  }
};