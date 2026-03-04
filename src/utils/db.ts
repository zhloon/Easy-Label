import { ipcRenderer } from 'electron';
import type { LabelData } from '../types';

// ⚠️ 请替换为您真实的 Worker 域名地址
const API_BASE = 'https://api.easylabel.cloud/api/labels'; 

// 获取当前登录用户的凭证
async function getAuthPayload() {
  const key = localStorage.getItem('easy_label_vip_key');
  // 从主进程获取设备硬件指纹
  const deviceId = await ipcRenderer.invoke('get-device-id');
  return { key, deviceId };
}

/**
 * 查：从云端获取当前用户的所有标签 (带分页支持)
 */
export async function getAllLabels(page: number = 1, pageSize: number = 15): Promise<{labels: LabelData[], total: number}> {
  try {
    const auth = await getAuthPayload();
    if (!auth.key) return { labels: [], total: 0 };

    const res = await fetch(`${API_BASE}/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...auth, page, pageSize })
    });
    const data = await res.json();
    return data.success ? { labels: data.labels, total: data.total } : { labels: [], total: 0 };
  } catch (err) {
    console.error('云端拉取标签失败:', err);
    return { labels: [], total: 0 };
  }
}

/**
 * 增/改：保存标签到云端 (重点捕获查重报错)
 */
export async function saveLabel(label: LabelData): Promise<void> {
  try {
    const auth = await getAuthPayload();
    console.log(`👉 正在请求云端保存标签: [${label.name}]`, label);

    const res = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...auth, label })
    });
    
    // 🔍 重点：先不解析 JSON，直接把云端返回的原始纯文本打印出来看！
    const rawText = await res.text();
    console.log('📦 云端真实返回内容:', rawText);

    // 然后再转回 JSON 判断
    const data = JSON.parse(rawText);
    
    if (!data.success) {
      console.warn('⚠️ 云端拒绝保存:', data.error);
      throw new Error(data.error || '云端保存失败');
    }
  } catch (err: any) {
    console.error('❌ saveLabel 底层捕获到异常:', err.message);
    throw err; // 继续向上抛出，让 App.vue 的 Toast 弹出来
  }
}

/**
 * 删：从云端删除指定标签
 */
export async function deleteLabel(id: string): Promise<void> {
  const auth = await getAuthPayload();
  const res = await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...auth, labelId: id })
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.error || '云端删除失败');
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