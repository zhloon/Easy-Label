import { ipcRenderer } from 'electron';
import localforage from 'localforage';
import type { LabelData } from '../types';
import { apiClient } from '../api'; 

const CACHE_KEY = 'easy_label_cached_data';

async function getAuthPayload() {
  const key = localStorage.getItem('easy_label_vip_key');
  const deviceId = await ipcRenderer.invoke('get-device-id');
  return { key, deviceId };
}

// 清理缓存方法
export async function clearLocalCache(): Promise<void> {
  await localforage.removeItem(CACHE_KEY);
}

/**
 * 查：优先从本地读取，本地没有则从云端验证、拉取并缓存到本地
 */
export async function getAllLabels(page: number = 1, pageSize: number = 15): Promise<{labels: LabelData[], total: number}> {
  try {
    const auth = await getAuthPayload();
    if (!auth.key) return { labels: [], total: 0 };

    let localData: LabelData[] | null = await localforage.getItem(CACHE_KEY);

    if (!localData || localData.length === 0) {
      console.log('🔄 缓存为空 (或被强制清理)，正在从云端拉取最新数据...');
      
      const data: any = await apiClient.post('/api/labels/get', { 
        ...auth, 
        page: 1, 
        pageSize: 9999 
      });
      
      if (data.success && data.labels) {
        localData = data.labels;
        await localforage.setItem(CACHE_KEY, localData);
        console.log(`✅ 云端同步完成，成功缓存 ${localData!.length} 条数据`);
      } else {
        return { labels: [], total: 0 };
      }
    } else {
      console.log('⚡ 命中本地缓存，数据极速加载');
    }

    const total = localData!.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLabels = localData!.slice(startIndex, endIndex);
    
    return { labels: paginatedLabels, total };
  } catch (err) {
    console.error('获取标签失败:', err);
    return { labels: [], total: 0 };
  }
}

/**
 * 增/改：保存到云端成功后，直接销毁本地缓存，强制触发云端重拉
 */
export async function saveLabel(label: LabelData): Promise<void> {
  try {
    const auth = await getAuthPayload();
    console.log(`👉 正在请求云端保存标签: [${label.name}]`);

    const data: any = await apiClient.post('/api/labels/save', { 
      ...auth, 
      label 
    });
    
    if (!data.success) {
      throw new Error(data.error || '云端保存失败');
    }

    // 🌟 核心修改：保存成功后，立即销毁缓存
    console.log('🗑️ 保存成功，销毁本地缓存以备重拉...');
    await clearLocalCache();

  } catch (err: any) {
    console.error('❌ saveLabel 底层捕获到异常:', err.message);
    throw err; 
  }
}

/**
 * 删：从云端删除成功后，直接销毁本地缓存，强制触发云端重拉
 */
export async function deleteLabel(id: string): Promise<void> {
  const auth = await getAuthPayload();
  
  const data: any = await apiClient.post('/api/labels/delete', { 
    ...auth, 
    labelId: id 
  });
  
  if (!data.success) throw new Error(data.error || '云端删除失败');

  // 🌟 核心修改：删除成功后，立即销毁缓存
  console.log('🗑️ 删除成功，销毁本地缓存以备重拉...');
  await clearLocalCache();
}

/**
 * 批量导入：上传本地 JSON 数据到云端
 */
export async function clearAndImportDB(data: LabelData[]): Promise<void> {
  for (const item of data) {
    if (!item.id) item.id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    await saveLabel(item); 
  }
}