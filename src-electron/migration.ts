import axios from 'axios';
import { BrowserWindow, IpcMainEvent } from 'electron';
import { AuthResult, MigrationResult } from '../src/types';

// 平台配置常量
const PLATFORMS = {
  shuaishou: {
    name: '甩手工具',
    baseUrl: 'https://dztool.shuaishou.com',
    platforms: [
      { name: 'TEMU', typeId: 1, platformId: 1 },
      { name: 'SHEIN', typeId: 4, platformId: 2 },
      { name: 'TIKTOK', typeId: 5, platformId: 3 },
      { name: 'ALIEXPRESS', typeId: 6, platformId: 4 },
      { name: 'AMAZON', typeId: 7, platformId: 5 }
    ],
    listApi: '/api/tool_api/printTemplates/list',
    detailApi: (id: number) => `/api/tool_api/printTemplates/detail?id=${id}`,
    tokenKey: 'tokenKey',
    token: 'token'
  },
  jiatong: {
    name: '佳同工具',
    baseUrl: 'https://www.tupianfanyi.com',
    platforms: ['TEMU', 'SHEIN', 'TIKTOK', 'ALIEXPRESS', 'AMAZON'],
    listApi: '/bqConcat/get',
    detailApi: '/bqConcat/getById'
  }
};

// 甩手工具数据转换
function convertShuaishouData(sourceJson: any, targetPlatform: string): any {
  console.log(`🔄 [Migration] 开始转换甩手数据:`, {
    targetPlatform,
    sourceKeys: Object.keys(sourceJson),
    hasCanvasJSON: !!sourceJson.canvasJSON,
    hasJson: !!sourceJson.json,
    hasContent: !!sourceJson.content
  });
  
  const outLabel = {
    id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
    name: (sourceJson.name || '导入的标签') + '（甩手）',
    wMM: sourceJson.width || 100,
    hMM: sourceJson.height || 100,
    platform: targetPlatform,
    elements: [] as any[]
  };

  try {
    const jsonStr = sourceJson.canvasJSON || sourceJson.json || sourceJson.content || '{}';
    console.log(`📝 [Migration] 甩手 canvasJSON 字符串长度:`, jsonStr.length);
    
    const canvasData = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    console.log(`📊 [Migration] 甩手 canvasData:`, {
      hasObjects: !!canvasData.objects,
      objectsLength: Array.isArray(canvasData.objects) ? canvasData.objects.length : 0,
      canvasKeys: Object.keys(canvasData)
    });
    
    let zIndex = 100;

    if (canvasData && canvasData.objects && Array.isArray(canvasData.objects)) {
      outLabel.elements = canvasData.objects.map((el: any) => {
        const out: any = {
          id: (Date.now() + Math.floor(Math.random() * 100000)).toString(),
          style: {
            zIndex: zIndex++,
            left: (el.left || 0) + 'px',
            top: (el.top || 0) + 'px',
            width: ((el.width || 0) * (el.scaleX || 1)) + 'px',
            height: ((el.height || 0) * (el.scaleY || 1)) + 'px'
          }
        };

        if (el.type === 'textbox' || el.type === 'text') {
          out.type = 'text';
          out.content = el.text || '';
          out.fontSize = ((el.fontSize || 14) * (el.scaleY || 1)) + 'px';
          out.fontWeight = el.fontWeight === 'bold' ? 'bold' : 'normal';
        } else if (el.type === 'barcode' || el.isBarcode) {
          out.type = 'barcode';
          out.content = el.text || el.code || '123456';
        } else if (el.type === 'rect' || el.type === 'line') {
          out.type = 'line';
          out.isVertical = (el.height * (el.scaleY || 1)) > (el.width * (el.scaleX || 1)) ? 'true' : 'false';
        } else if (el.type === 'image') {
          out.type = 'image';
          out.imgUrl = el.src || '';
        }

        return out;
      });
    }
    
    console.log(`✅ [Migration] 甩手数据转换完成:`, {
      elementsCount: outLabel.elements.length,
      name: outLabel.name,
      wMM: outLabel.wMM,
      hMM: outLabel.hMM
    });
  } catch (err: any) {
    console.error('❌ [Migration] 解析甩手数据失败', err.message, err.stack);
  }

  return outLabel;
}

// 佳同工具数据转换
function convertJiatongData(sourceJson: any, targetPlatform: string): any {
  const R = 1.25;
  const fontRatio = 0.85;
  
  console.log(`🔄 [Migration] 开始转换佳同数据:`, {
    targetPlatform,
    sourceKeys: Object.keys(sourceJson),
    hasCanvasJSON: !!sourceJson.canvasJSON,
    hasJson: !!sourceJson.json,
    hasContent: !!sourceJson.content
  });

  const outLabel = {
    id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
    name: (sourceJson.name || '导入的标签') + '（佳同）',
    wMM: sourceJson.width || sourceJson.tmWidth || 100,
    hMM: sourceJson.height || sourceJson.tmHeight || 100,
    platform: targetPlatform,
    elements: [] as any[]
  };

  try {
    if (sourceJson.canvasJSON) {
      console.log(`📝 [Migration] 佳同 canvasJSON 字符串长度:`, sourceJson.canvasJSON.length);
      
      const canvasData = JSON.parse(sourceJson.canvasJSON);
      console.log(`📊 [Migration] 佳同 canvasData:`, {
        hasObjects: !!canvasData.objects,
        objectsLength: Array.isArray(canvasData.objects) ? canvasData.objects.length : 0,
        canvasKeys: Object.keys(canvasData)
      });
      
      let zIndex = 100;

      if (canvasData.objects && Array.isArray(canvasData.objects)) {
        outLabel.elements = canvasData.objects.map((el: any) => {
          const out: any = {
            id: (Date.now() + Math.floor(Math.random() * 100000)).toString(),
            style: { zIndex: zIndex++ }
          };

          let w = (el.width || 0) * (el.scaleX || 1);
          let h = (el.height || 0) * (el.scaleY || 1);

          if (el.type === 'line' && w === 0 && h === 0) {
            w = Math.abs((el.x2 || 0) - (el.x1 || 0)) * (el.scaleX || 1);
            h = Math.abs((el.y2 || 0) - (el.y1 || 0)) * (el.scaleY || 1);
          }

          const rad = (el.angle || 0) * Math.PI / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          const px = el.originX === 'center' ? w / 2 : (el.originX === 'right' ? w : 0);
          const py = el.originY === 'center' ? h / 2 : (el.originY === 'bottom' ? h : 0);

          const corners = [
            { x: -px, y: -py },
            { x: w - px, y: -py },
            { x: -px, y: h - py },
            { x: w - px, y: h - py }
          ];

          const absCorners = corners.map(c => ({
            x: el.left + (c.x * cos - c.y * sin),
            y: el.top + (c.x * sin + c.y * cos)
          }));

          const minX = Math.min(...absCorners.map(c => c.x));
          const maxX = Math.max(...absCorners.map(c => c.x));
          const minY = Math.min(...absCorners.map(c => c.y));
          const maxY = Math.max(...absCorners.map(c => c.y));

          const actualW = (maxX - minX) * R;
          const actualH = (maxY - minY) * R;
          const trueX = minX * R;
          const trueY = minY * R;

          if (el.type === 'barcode' || el.type === 'BarCode' || el.isBarcode || (el.type === 'image' && el.tag?.isSkuBarCode)) {
            out.type = 'barcode';
            out.content = el.text || el.content || el.code || '123456';
            out.customW = Math.round(w / 7.56) || 70;
            out.customH = Math.round(h / 7.56) || 20;
            out.style.width = (out.customW * 7.56).toFixed(2) + 'px';
            out.style.height = (out.customH * 7.56).toFixed(2) + 'px';
            out.style.left = trueX.toFixed(2) + 'px';
            out.style.top = trueY.toFixed(2) + 'px';
          } else if (el.type === 'textbox' || el.type === 'i-text' || el.type === 'text') {
            out.type = 'text';
            out.content = el.text || '';
            const exactFontSize = (el.fontSize || 14) * (el.scaleY || 1) * R * fontRatio;
            out.fontSize = exactFontSize.toFixed(2) + 'px';
            const isBold = el.fontWeight === 'bold' || String(el.fontWeight) === '700' || Number(el.fontWeight) >= 600 || el.bold === true || el.isBold === true || String(el.fontFamily).toLowerCase().includes('bold') || (el.strokeWidth > 0 && el.stroke && el.stroke !== 'transparent' && el.stroke !== '#ffffff');
            out.fontWeight = isBold ? 'bold' : 'normal';
            const widthPadding = exactFontSize * 0.15 + 2;
            out.style.width = (actualW + widthPadding).toFixed(2) + 'px';
            out.style.height = 'auto';
            out.style.left = trueX.toFixed(2) + 'px';
            out.style.top = trueY.toFixed(2) + 'px';
            out.style.lineHeight = el.lineHeight || 1.16;
            const isSingleLine = (el.textLines && el.textLines.length === 1) || !out.content.includes('\n');
            if (isSingleLine) {
              out.style.whiteSpace = 'nowrap';
            } else {
              out.style.whiteSpace = 'pre-wrap';
              out.style.wordBreak = 'break-word';
            }
          } else if (el.type === 'rect' || el.type === 'line') {
            out.type = 'line';
            const isVertical = actualH > actualW;
            if (isVertical) {
              out.isVertical = 'true';
              out.style.width = '1.5px';
              out.style.height = actualH.toFixed(2) + 'px';
              out.style.left = (trueX + actualW / 2 - 0.75).toFixed(2) + 'px';
              out.style.top = trueY.toFixed(2) + 'px';
            } else {
              out.isVertical = 'false';
              out.style.height = '1.5px';
              out.style.width = actualW.toFixed(2) + 'px';
              out.style.left = trueX.toFixed(2) + 'px';
              out.style.top = (trueY + actualH / 2 - 0.75).toFixed(2) + 'px';
            }
          } else if (el.type === 'image') {
            out.type = 'image';
            out.imgUrl = el.src || el.url || '';
            out.style.width = actualW.toFixed(2) + 'px';
            out.style.height = actualH.toFixed(2) + 'px';
            out.style.left = trueX.toFixed(2) + 'px';
            out.style.top = trueY.toFixed(2) + 'px';
          }

          return out;
        });
      }
    } else {
      console.log(`⚠️ [Migration] 佳同数据没有 canvasJSON 字段!`);
    }
    
    console.log(`✅ [Migration] 佳同数据转换完成:`, {
      elementsCount: outLabel.elements.length,
      name: outLabel.name,
      wMM: outLabel.wMM,
      hMM: outLabel.hMM
    });
  } catch (err: any) {
    console.error('❌ [Migration] 解析佳同数据失败', err.message, err.stack);
  }

  return outLabel;
}

// 获取平台列表数据
async function fetchPlatformList(platform: string, auth: AuthResult, progressCallback: (message: string) => void): Promise<any[]> {
  const config = PLATFORMS[platform as keyof typeof PLATFORMS];
  const headers = platform === 'shuaishou'
    ? { 'Content-Type': 'application/json', 'token': auth.token, [config.tokenKey]: auth.tokenKey }
    : { 'Authorization': auth.token };

  console.log(`📋 [Migration] 开始获取平台列表:`, {
    platform,
    configName: config.name,
    baseUrl: config.baseUrl,
    auth: platform === 'shuaishou' ? {
      token: auth.token ? auth.token.substring(0, 10) + '...' : 'missing',
      tokenKey: auth.tokenKey ? auth.tokenKey.substring(0, 10) + '...' : 'missing'
    } : {
      token: auth.token ? auth.token.substring(0, 10) + '...' : 'missing'
    },
    headers
  });

  const results: any[] = [];

  for (const plat of config.platforms) {
    const platName = typeof plat === 'string' ? plat : plat.name;
    progressCallback(`正在查询 ${platName} 平台模板...`);

    try {
      const listRes = await axios.post(
        `${config.baseUrl}${config.listApi}`,
        platform === 'shuaishou'
          ? { pageNo: 1, pageSize: 99999, param: { keyword: '', typeId: (plat as any).typeId, platform: (plat as any).platformId } }
          : new URLSearchParams({ platform: platName, currentPage: '1', limit: '9999' }),
        { headers }
      );

      console.log(`🔍 [Migration] ${platName} 列表响应:`, {
        code: listRes.data.code,
        hasData: !!listRes.data.data,
        itemsCount: Array.isArray(listRes.data.data) ? listRes.data.data.length : (listRes.data.data?.list?.length || 0)
      });

      let items: any[] = [];
      if (listRes.data.code === 0 && listRes.data.data) {
        items = Array.isArray(listRes.data.data) ? listRes.data.data : (listRes.data.data.list || []);
      }

      const ids = items.map((item: any) => item.mainid || item.id).filter((id: any) => id);
      console.log(`📝 [Migration] ${platName} 有效 ID 数量:`, ids.length);
      if (ids.length === 0) continue;

      for (let i = 0; i < ids.length; i++) {
        progressCallback(`正在迁移 ${platName} (${i + 1}/${ids.length})`);
        try {
          const detailUrl = platform === 'shuaishou'
            ? `${config.baseUrl}${(config.detailApi as (id: number) => string)(ids[i])}`
            : `${config.baseUrl}${config.detailApi}`;
          
          const detailRes = platform === 'shuaishou'
            ? await axios.get(
                detailUrl,
                { headers }
              )
            : await axios.post(
                detailUrl,
                new URLSearchParams({ id: String(ids[i]) }),
                { headers }
              );

          console.log(`📊 [Migration] ${platName} #${ids[i]} 详情响应:`, {
            code: detailRes.data?.code,
            hasData: !!detailRes.data?.data,
            dataKeys: detailRes.data?.data ? Object.keys(detailRes.data.data) : null
          });

          if (detailRes.data?.code === 0 || detailRes.data?.data) {
            const converter = platform === 'shuaishou' ? convertShuaishouData : convertJiatongData;
            const rawData = detailRes.data.data || detailRes.data;
            console.log(`🔍 [Migration] ${platName} #${ids[i]} 原始数据:`, {
              hasCanvasJSON: !!rawData.canvasJSON,
              hasJson: !!rawData.json,
              hasContent: !!rawData.content,
              keys: Object.keys(rawData),
              canvasJSONType: typeof rawData.canvasJSON
            });
            const converted = converter(rawData, platName);
            console.log(`✅ [Migration] ${platName} #${ids[i]} 转换完成:`, {
              id: converted.id,
              name: converted.name,
              wMM: converted.wMM,
              hMM: converted.hMM,
              platform: converted.platform,
              elementsCount: converted.elements?.length || 0
            });
            results.push(converted);
          } else {
            console.warn(`⚠️ [Migration] ${platName} #${ids[i]} 无有效数据`, detailRes.data);
          }
        } catch (e: any) {
          console.error(`❌ [Migration] ${platName} #${ids[i]} 迁移失败:`, e.message);
        }
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (err: any) {
      console.error(`❌ [Migration] ${config.name} ${platName} 失败:`, err.message);
    }
  }

  console.log(`🏁 [Migration] 所有平台迁移完成:`, {
    totalPlatforms: config.platforms.length,
    totalResults: results.length
  });

  return results;
}

// 执行数据迁移
export async function executeMigration(
  platform: string,
  auth: AuthResult,
  event: IpcMainEvent
): Promise<MigrationResult> {
  try {
    console.log(`🚀 [Migration] 开始执行数据迁移:`, {
      platform,
      hasToken: !!auth.token,
      tokenKey: auth.tokenKey
    });
    
    event.sender.send('migration-progress', '已获取有效授权，开始抓取数据...');

    const convertedLabels = await fetchPlatformList(platform, auth, (message) => {
      event.sender.send('migration-progress', message);
    });

    console.log(`✅ [Migration] 数据迁移完成:`, {
      platform,
      totalLabels: convertedLabels.length,
      labels: convertedLabels.map((l: any) => ({ id: l.id, name: l.name, platform: l.platform }))
    });

    return {
      success: true,
      labels: convertedLabels,
      count: convertedLabels.length
    };
  } catch (error: any) {
    console.error(`❌ [Migration] 数据迁移失败:`, error.message);
    return {
      success: false,
      error: error.message || '迁移过程发生错误'
    };
  }
}

// 创建迁移窗口
export function createMigrationWindow(platform: string): BrowserWindow {
  const config = PLATFORMS[platform as keyof typeof PLATFORMS];
  
  return new BrowserWindow({
    width: 1000,
    height: 700,
    title: `登录${config.name}`,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:store'
    }
  });
}

// 检查登录状态
export async function checkLoginStatus(
  platform: string,
  window: BrowserWindow
): Promise<AuthResult | null> {
  if (window.isDestroyed()) return null;

  try {
    if (platform === 'shuaishou') {
      const result = await window.webContents.executeJavaScript(`
        (function() {
          console.log('[Debug] 检查甩手 localStorage:', Object.keys(window.localStorage));
          const userStoreStr = window.localStorage.getItem('userStore');
          console.log('[Debug] userStoreStr:', userStoreStr);
          if (!userStoreStr) return null;
          const userStore = JSON.parse(userStoreStr);
          console.log('[Debug] userStore:', userStore);
          if (!userStore.token) return null;
          return { token: userStore.token, tokenKey: userStore.tokenKey };
        })();
      `);
      console.log(`📋 [Migration] 甩手 token 检查结果:`, result ? { 
        hasToken: !!result.token, 
        hasTokenKey: !!result.tokenKey,
        tokenLen: result.token?.length,
        tokenKeyLen: result.tokenKey?.length
      } : 'null');
      if (result) {
        console.log(`✅ [Migration] 甩手工具登录状态检查成功`);
      } else {
        console.log(`⏳ [Migration] 甩手工具尚未登录`);
      }
      return result;
    } else if (platform === 'jiatong') {
      const result = await window.webContents.executeJavaScript(`
        (function() {
          console.log('[Debug] 检查佳同 localStorage:', Object.keys(window.localStorage));
          console.log('[Debug] 检查佳同 sessionStorage:', Object.keys(window.sessionStorage));
          const token = window.localStorage.getItem('token') || window.sessionStorage.getItem('token');
          console.log('[Debug] token:', token);
          if (!token) return null;
          return { token: token };
        })();
      `);
      console.log(`📋 [Migration] 佳同 token 检查结果:`, result ? { 
        hasToken: !!result.token,
        tokenLen: result.token?.length
      } : 'null');
      if (result) {
        console.log(`✅ [Migration] 佳同工具登录状态检查成功`);
      } else {
        console.log(`⏳ [Migration] 佳同工具尚未登录`);
      }
      return result;
    }
  } catch (e: any) {
    console.error(`❌ [Migration] 检查登录状态失败:`, e.message, e.stack);
    return null;
  }

  return null;
}

// 注入登录提示
export function injectLoginTip(window: BrowserWindow, platform: string): void {
  const config = PLATFORMS[platform as keyof typeof PLATFORMS];
  
  const injectTipScript = `
    if (!document.getElementById('easy-label-login-tip')) {
      const tip = document.createElement('div');
      tip.id = 'easy-label-login-tip';
      tip.style.cssText = 'position:fixed; top:24px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color:#fff; padding:16px 32px; border-radius:16px; z-index:2147483647; font-family:sans-serif; font-size:16px; font-weight:bold; box-shadow:0 10px 25px -5px rgba(79, 70, 229, 0.4); pointer-events:none; text-align:center; animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1);';
      const style = document.createElement('style');
      style.innerHTML = '@keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 24px; opacity: 1; } }';
      document.head.appendChild(style);
      tip.innerHTML = '✨ 易标签助手：请在此窗口登录${config.name}<br><span style="font-size:13px; font-weight:normal; opacity:0.9; margin-top:6px; display:inline-block;">登录成功后，此窗口将自动关闭并开始极速搬家</span>';
      document.body.appendChild(tip);
    }
  `;
  
  window.webContents.executeJavaScript(injectTipScript).catch(() => {});
}
