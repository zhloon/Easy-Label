// src/utils/db.ts
import type { LabelData } from '../types';

const DB_NAME = 'EasyLabel_Vue_DB';
const DB_VERSION = 1;
const STORE_LABELS = 'labels';

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_LABELS)) {
        db.createObjectStore(STORE_LABELS, { keyPath: 'id' });
      }
    };
  });
}

export async function getAllLabels(): Promise<LabelData[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LABELS, 'readonly');
      const req = tx.objectStore(STORE_LABELS).getAll();
      req.onsuccess = () => resolve((req.result as LabelData[]) || []);
      req.onerror = () => reject(req.error);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('getAllLabels error:', error);
    return [];
  }
}

export async function saveLabel(labelData: LabelData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LABELS, 'readwrite');
    const req = tx.objectStore(STORE_LABELS).put(JSON.parse(JSON.stringify(labelData)));
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLabel(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LABELS, 'readwrite');
    const req = tx.objectStore(STORE_LABELS).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
}

// ★ 修复：补全本地库导入时需要的覆盖写入方法
export async function clearAndImportDB(labelsArray: LabelData[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LABELS, 'readwrite');
    const store = tx.objectStore(STORE_LABELS);
    store.clear(); // 先清空所有旧数据
    labelsArray.forEach(l => store.put(l)); // 遍历写入新数据
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
