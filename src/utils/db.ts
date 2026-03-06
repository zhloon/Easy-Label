import { ipcRenderer } from 'electron';

const DB_NAME = 'easy-label-db';
const STORE_NAME = 'labels';

// 初始化本地 IndexedDB 缓存
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const getAuthKey = () => localStorage.getItem('easy_label_vip_key') || '';

// --- 本地底层操作 ---
async function saveToLocal(label: any) {
  const db = await getDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(label);
    tx.oncomplete = () => resolve(true);
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

// 🌟 新增：专门供给删除后本地极速重载分页数据的方法
export async function getLocalLabelsPaginated(page = 1, pageSize = 10) {
  const localData = await getLocalLabels();
  // 模拟服务端：按时间倒序排列（最新的在最前）
  localData.sort((a, b) => Number(b.id) - Number(a.id));
  const start = (page - 1) * pageSize;
  return { 
    labels: localData.slice(start, start + pageSize), 
    total: localData.length 
  };
}

// ==========================================
// 🌟 统一网络请求层
// ==========================================

export async function apiPost(path: string, data: any = {}) {
  const deviceId = await ipcRenderer.invoke('get-device-id');
  const key = data.key !== undefined ? data.key : getAuthKey();
  const payload = { key, deviceId, ...data };
  const baseURL = import.meta.env.DEV ? '' : 'https://easylabel.cloud';

  try {
    const response = await fetch(`${baseURL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (err: any) {
    return { success: false, error: err.message || '网络请求失败，请检查网络连接' };
  }
}

export async function apiGet(path: string) {
  const baseURL = import.meta.env.DEV ? '' : 'https://easylabel.cloud';
  try {
    const response = await fetch(`${baseURL}${path}`);
    return await response.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export const apiAutoLogin = () => apiPost('/api/auto-login');
export const apiVerifyLicense = (key: string) => apiPost('/api/verify', { key });
export const apiUnbindLicense = (key: string) => apiPost('/api/unbind', { key });

// ==========================================
// 🌟 强一致性业务层
// ==========================================

export async function saveLabel(label: any) {
  if (!getAuthKey()) throw new Error('未授权');
  const res = await apiPost('/api/labels/save', { label });
  if (!res.success) throw new Error(res.error || '云端保存失败');
  await saveToLocal(label); 
  return res;
}

export async function deleteLabel(labelId: string) {
  if (!getAuthKey()) throw new Error('未授权');
  const res = await apiPost('/api/labels/delete', { labelId });
  if (!res.success) throw new Error(res.error || '云端删除失败');
  await deleteFromLocal(labelId);
  return res;
}

export async function getCloudLabels(page = 1, pageSize = 10) {
  if (!getAuthKey()) throw new Error('未授权');
  try {
    const res = await apiPost('/api/labels/get', { page, pageSize });
    if (!res.success) throw new Error(res.error || '获取云端数据失败');
    
    const labels = res.labels || [];
    for (const lbl of labels) await saveToLocal(lbl); 
    return { labels, total: res.total || labels.length };
  } catch (err) {
    return await getLocalLabelsPaginated(page, pageSize);
  }
}
// 🌟 新增：联合查询方法（优先查本地，本地没数据再查云端）
export async function getLocalThenCloudLabels(page = 1, pageSize = 10) {
  // 1. 先进行本地分页查询
  const localData = await getLocalLabelsPaginated(page, pageSize);
  
  // 2. 如果本地查询到了数据，直接返回本地数据
  if (localData.labels && localData.labels.length > 0) {
    return localData;
  }
  
  // 3. 如果本地完全为空（或者当前页为空），兜底去云端拉取确认
  return await getCloudLabels(page, pageSize);
}

export async function clearAndImportDB(labels: any[]) {
  for (const label of labels) await saveLabel(label); 
}