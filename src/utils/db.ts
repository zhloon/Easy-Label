import localforage from 'localforage';
import type { LabelData } from '../types';

// ==========================================
// IndexedDB 本地数据库初始化配置
// ==========================================
localforage.config({
  name: 'EasyLabelDB',         // 数据库名称
  storeName: 'labels_store',   // 数据表（仓库）名称
  description: '用于存储易标签(Easy Label)用户的本地标签数据'
});

/**
 * 获取本地数据库中所有的标签数据
 * @returns {Promise<LabelData[]>} 返回一个包含所有标签对象的数组
 */
export async function getAllLabels(): Promise<LabelData[]> {
  const labels: LabelData[] = [];
  try {
    // 遍历 localforage 中的所有 key-value 对
    await localforage.iterate((value: LabelData) => {
      labels.push(value);
    });
  } catch (err) {
    console.error('读取本地标签库失败:', err);
  }
  return labels;
}

/**
 * 保存或更新单个标签数据
 * @param {LabelData} label - 需要保存的标签对象 (需包含唯一的 id)
 */
export async function saveLabel(label: LabelData): Promise<void> {
  try {
    // 以 label.id 为键名存入 IndexedDB
    await localforage.setItem(label.id, label);
  } catch (err) {
    console.error('保存标签失败:', err);
    throw err; // 向上抛出错误，以便 UI 层捕获并弹窗提示
  }
}

/**
 * 根据 ID 删除指定的标签
 * @param {string} id - 标签的唯一标识符
 */
export async function deleteLabel(id: string): Promise<void> {
  try {
    await localforage.removeItem(id);
  } catch (err) {
    console.error('删除标签失败:', err);
    throw err;
  }
}

/**
 * 危险操作：清空当前数据库，并导入新的数据集 (用于“导入本地库”功能)
 * @param {LabelData[]} data - 从 JSON 文件解析出的完整标签数组
 */
export async function clearAndImportDB(data: LabelData[]): Promise<void> {
  try {
    // 1. 彻底清空现有数据表
    await localforage.clear();
    // 2. 遍历新数据并逐条插入
    for (const item of data) {
      // 兼容性处理：如果导入的数据缺少 id，则使用时间戳加随机数重新生成
      if (!item.id) {
        item.id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      }
      await localforage.setItem(item.id, item);
    }
  } catch (err) {
    console.error('导入恢复数据失败:', err);
    throw err;
  }
}