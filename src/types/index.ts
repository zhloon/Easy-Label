export interface ElementStyle {
  width: string;
  height: string;
  left: string;
  top: string;
  zIndex: number;
}

export interface LabelElement {
  id: string;
  type: 'text' | 'image' | 'barcode' | 'line' | 'rect';
  style: ElementStyle;
  content?: string;
  fontSize?: string;
  fontWeight?: string;
  imgUrl?: string;
  originalUrl?: string;
  isVertical?: 'true' | 'false';
  // 🌟 新增以下两行：用于记忆条码的自定义物理尺寸
  customW?: number; 
  customH?: number;
}

export interface LabelData {
  id: string;
  name: string;
  wMM: number;
  hMM: number;
  elements: LabelElement[];
}

export interface ComponentItem {
  type: string;
  name: string;
  content?: string;
  sub?: string;
  img?: string;
}

export interface ComponentGroup {
  groupTitle: string;
  items: ComponentItem[];
}

export interface ComponentCategory {
  parentTitle: string;
  groups: ComponentGroup[];
}
export interface LabelData {
  id: string;
  name: string;
  wMM: number;
  hMM: number;
  elements: LabelElement[];
  platform?: string; // 🌟 新增这一行（使用 ? 表示可选，兼容老数据）
  // ... 其他你原有的属性
}

// 迁移相关类型定义
export interface AuthResult {
  token: string;
  tokenKey?: string;
}

export interface MigrationResult {
  success: boolean;
  labels?: any[];
  count?: number;
  error?: string;
}

export interface PlatformConfig {
  name: string;
  baseUrl: string;
  platforms: any[];
  listApi: string | ((id: number) => string);
  detailApi: string | ((id: number) => string);
  tokenKey: string;
}