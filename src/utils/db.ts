import { ipcRenderer } from 'electron';
import axios from 'axios';

const DB_NAME = 'easy-label-db';
const STORE_NAME = 'labels';


// 🌟 1. 单例缓存，防止高并发频繁打开数据库导致连接断开
let dbInstance: IDBDatabase | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

const getAuthKey = () => localStorage.getItem('easy_label_vip_key') || '';

// --- 本地底层操作 ---
export async function saveToLocal(label: any) {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(label);
    tx.oncomplete = () => resolve(true);
  });
}

// 🌟 2. 批量将所有标签安全写入本地（不丢数据）
export async function saveBatchToLocal(labels: any[]) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    labels.forEach(label => { store.put(label); });
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e);
  });
}

async function deleteFromLocal(id: string) {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve(true);
  });
}

export async function clearLocalCache() {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve(true);
  });
}

async function getLocalLabels(): Promise<any[]> {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

// 1. 本地筛选逻辑
export async function getLocalLabelsPaginated(page = 1, pageSize = 10, platform = 'TEMU') {
  const localData = await getLocalLabels();
  
  // 🌟 因为去掉了 ALL，所以这里直接强制严格过滤
  const filteredData = localData.filter(l => (l.platform || 'OTHER') === platform);

  filteredData.sort((a, b) => Number(b.id) - Number(a.id));
  const start = (page - 1) * pageSize;
  return { 
    labels: filteredData.slice(start, start + pageSize), 
    total: filteredData.length 
  };
}

// ==========================================
// 🌟 统一网络请求层 (Axios)
// ==========================================
const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '' : 'https://easylabel.cloud',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.includes('<html')) {
      return Promise.reject(new Error('网络被劫持或返回格式异常'));
    }
    return response.data;
  },
  (error) => {
    console.error('API 请求异常:', error.message);
    return Promise.resolve({
      success: false,
      error: error.response?.data?.error || error.message || '网络请求失败，请检查网络连接'
    });
  }
);

// 🌟 强制声明返回 Promise<any>，并使用 as any 断言
export async function apiPost(path: string, data: any = {}): Promise<any> {
  const deviceId = await ipcRenderer.invoke('get-device-id');
  const key = data.key !== undefined ? data.key : getAuthKey();
  const payload = { key, deviceId, ...data };
  
  // 加上 as any 告诉 TS 不要用 Axios 默认的类型去推导了
  return (await apiClient.post(path, payload)) as any;
}

// 🌟 强制声明返回 Promise<any>，并使用 as any 断言
export async function apiGet(path: string): Promise<any> {
  return (await apiClient.get(path)) as any;
}

export const apiAutoLogin = () => apiPost('/api/auto-login');
export const apiVerifyLicense = (key: string) => apiPost('/api/verify', { key });
export const apiUnbindLicense = (key: string) => apiPost('/api/unbind', { key });

// ==========================================
// 🌟 强一致性业务层
// ==========================================

// 替换原有的 saveLabel 方法
export async function saveLabel(label: any) {
  if (!getAuthKey()) {
    // 如果没有登录授权，只作为离线工具存入本地
    await saveToLocal(label); 
    return { success: true };
  }
  
  // 🌟 核心修改：先强制请求云端保存
  const res: any = await apiPost('/api/labels/save', { label });
  
  // 如果云端报错了，直接抛出异常中断，不执行后面的本地保存
  if (!res.success) {
    throw new Error(res.error || '云端保存失败，已中止操作');
  }
  
  // 🌟 云端保存成功后，再将最新数据覆盖到本地缓存中
  await saveToLocal(label); 
  
  return res;
}

// 🌟 3. 新增：Cloudflare D1 专属，打包批量传云端
export async function saveBatchLabels(labels: any[]) {
  if (!getAuthKey()) throw new Error('未授权');
  const res: any = await apiPost('/api/labels/saveBatch', { labels });
  if (!res.success) throw new Error(res.error || '云端批量保存失败');
  return res;
}

export async function deleteLabel(labelId: string) {
  if (!getAuthKey()) throw new Error('未授权');
  const res: any = await apiPost('/api/labels/delete', { labelId });
  if (!res.success) throw new Error(res.error || '云端删除失败');
  await deleteFromLocal(labelId);
  return res;
}

// 2. 云端获取传入平台参数
export async function getCloudLabels(page = 1, pageSize = 10, platform = 'TEMU') {
  if (!getAuthKey()) throw new Error('未授权');
  try {
    const res: any = await apiPost('/api/labels/get', { page, pageSize, platform });
    if (!res.success) throw new Error(res.error || '获取云端数据失败');
    
    const labels = res.labels || [];
    for (const lbl of labels) await saveToLocal(lbl); 
    return { labels, total: res.total || labels.length };
  } catch (err) {
    return await getLocalLabelsPaginated(page, pageSize, platform);
  }
}

// 3. 联合查询传入平台参数
export async function getLocalThenCloudLabels(page = 1, pageSize = 10, platform = 'TEMU') {
  const localData = await getLocalLabelsPaginated(page, pageSize, platform);
  if (localData.labels && localData.labels.length > 0) return localData;
  return await getCloudLabels(page, pageSize, platform);
}

// ==========================================
// 🌟 数据迁移与导入功能重构
// ==========================================
export async function clearAndImportDB(labels: any[]) {
  if (!labels || labels.length === 0) {
    throw new Error('导入的数据为空');
  }

  // 1. 先清空本地旧数据缓存
  await clearLocalCache();

  // 2. 获取授权状态
  const isAuth = getAuthKey();

  if (!isAuth) {
    // ----------------------------------------
    // 【未登录状态】作为离线工具，直接批量写入本地
    // ----------------------------------------
    await saveBatchToLocal(labels);
    return { success: true, message: '本地数据导入成功' };
  } else {
    // ----------------------------------------
    // 【已登录状态】云端与本地双端同步
    // ----------------------------------------
    try {
      // 核心修改：使用专门的批量云端接口，一次网络请求完成所有数据的上传
      const cloudRes: any = await saveBatchLabels(labels);
      
      if (!cloudRes.success) {
        throw new Error(cloudRes.error || '云端批量保存失败');
      }

      // 云端批量保存成功后，再批量写入本地缓存，确保强一致性
      await saveBatchToLocal(labels);
      
      return { success: true, message: '云端与本地同步导入成功' };
    } catch (error: any) {
      // 如果云端保存失败，抛出异常阻断流程，不要写入本地，防止产生脏数据
      throw new Error(error.message || '导入过程中发生异常，已终止');
    }
  }
}