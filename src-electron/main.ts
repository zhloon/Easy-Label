import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import axios from 'axios';
import { generateHardDeviceId } from './hardwareId';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
let mainWindow: BrowserWindow | null = null;

// 🌟 智能获取静态资源路径 (兼容开发环境和打包后的生产环境)
const publicPath = process.env.VITE_DEV_SERVER_URL
  ? path.join(__dirname, '../public')
  : path.join(__dirname, '../dist');

// ==========================================
// 🌟 【主进程】统一 Axios 网络请求配置
// ==========================================
const apiClient = axios.create({
  baseURL: 'https://easylabel.cloud', // 统一为您真实的正式版云端域名
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// 主进程全局响应拦截
apiClient.interceptors.response.use(
  (res) => {
    if (typeof res.data === 'string') {
      return { success: false, error: '服务器返回格式异常，请检查网络' };
    }
    return res.data;
  },
  (error) => {
    console.error('❌ [Main API Error]:', error.message);
    return Promise.resolve({
      success: false,
      error: error.response?.data?.error || '网络连接失败，请检查网络并重试'
    });
  }
);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(publicPath, process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    autoHideMenuBar: true, 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false 
    }
  });
  mainWindow.setMenu(null);

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// ★ 核心安全区：卡密验证与解绑的 IPC 监听
// ==========================================
ipcMain.handle('verify-license', async (event, key: string) => {
  const deviceId = generateHardDeviceId();
  console.log(`👉 [API] 正在验证设备: ${deviceId}`);
  return await apiClient.post('/api/verify', { key, deviceId });
});

ipcMain.handle('unbind-license', async (event, key: string) => {
  const deviceId = generateHardDeviceId();
  console.log(`👉 [API] 正在申请解绑设备: ${deviceId}`);
  return await apiClient.post('/api/unbind', { key, deviceId });
});

ipcMain.handle('get-device-id', () => generateHardDeviceId());

ipcMain.handle('auto-login', async () => {
  const deviceId = generateHardDeviceId();
  console.log(`👉 [API] 正在静默登录设备: ${deviceId}`);
  return await apiClient.post('/api/auto-login', { deviceId });
});

ipcMain.handle('set-badge', (event, count: number) => {
  app.setBadgeCount(count);
  return { success: true };
});

// ======================================================================
// 🌟 独立封装：核心搬家执行逻辑 (增强版：带详细转换失败日志与空标签过滤)
// ======================================================================
async function executeMigration(platform: string, authResult: any, event: any) {
  let convertedLabels: any[] = [];
  
  console.log(`\n======================================================`);
  console.log(`🚀 [Migration] 开始执行 [${platform}] 平台搬家任务`);
  console.log(`🔑 [Migration] 提取到最新授权凭证:`, authResult);
  console.log(`======================================================\n`);
  
  event.sender.send('migration-progress', '已获取最新授权，开始抓取数据...');

  try {
    // ---------------------------------------------------------
    // 🚀 分支 A：甩手工具搬家逻辑
    // ---------------------------------------------------------
    if (platform === 'shuaishou') {
      const headers = { 'Content-Type': 'application/json', 'token': authResult.token, 'tokenKey': authResult.tokenKey };
      const shuaishouPlatforms = [
        { name: 'TEMU', typeId: 1, platformId: 1 }, { name: 'SHEIN', typeId: 4, platformId: 2 },
        { name: 'TIKTOK', typeId: 5, platformId: 3 }, { name: 'ALIEXPRESS', typeId: 6, platformId: 4 },
        { name: 'AMAZON', typeId: 7, platformId: 5 }
      ];

      function convertOldLabelData(sourceJson: any, targetPlatform: string) {
        const outLabel = {
          id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
          name: (sourceJson.name || "导入的标签") + "（甩手）",
          // 🌟 修复1：兼容甩手最新的宽/高字段名 signWidth / signHigh
          wMM: sourceJson.width || sourceJson.signWidth || 100, 
          hMM: sourceJson.height || sourceJson.signHigh || 100,
          platform: targetPlatform, 
          elements: [] as any[]
        };
        
        try {
          const jsonStr = sourceJson.printOption || sourceJson.canvasJSON || sourceJson.json || sourceJson.content || '[]';
          const parsedData = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
          
          let zIndex = 100;
          const elementsArray = Array.isArray(parsedData) ? parsedData : (parsedData.objects || []);

          if (elementsArray && elementsArray.length > 0) {
            outLabel.elements = elementsArray.map((el: any) => {
              
              // 1. 获取基础真实宽高（兼容底层 line 的 x/y 坐标系统）
              let w = (el.width || 0) * (el.scaleX || 1);
              let h = (el.height || 0) * (el.scaleY || 1);
              if (el.type === 'line' && w === 0 && h === 0) {
                w = Math.abs((el.x2 || 0) - (el.x1 || 0)) * (el.scaleX || 1);
                h = Math.abs((el.y2 || 0) - (el.y1 || 0)) * (el.scaleY || 1);
              }

              // 🌟 核心修复：引入矩阵运算！完美处理 angle 旋转导致的横线变竖线和坐标错位
              let rad = (el.angle || 0) * Math.PI / 180;
              let cos = Math.cos(rad);
              let sin = Math.sin(rad);

              // 判断中心锚点（兼容 Fabric.js 规则）
              let originX = el.originX || 'left';
              let originY = el.originY || 'top';
              let px = originX === 'center' ? w / 2 : (originX === 'right' ? w : 0);
              let py = originY === 'center' ? h / 2 : (originY === 'bottom' ? h : 0);

              // 获取相对于中心锚点的 4 个角坐标
              let corners = [
                { x: -px, y: -py },
                { x: w - px, y: -py },
                { x: -px, y: h - py },
                { x: w - px, y: h - py }
              ];

              // 将旋转后的角坐标还原为绝对定位
              let absCorners = corners.map(c => ({
                x: (el.left || 0) + (c.x * cos - c.y * sin),
                y: (el.top || 0) + (c.x * sin + c.y * cos)
              }));

              // 求出外接边界框（真实占用的物理空间位置）
              let minX = Math.min(...absCorners.map(c => c.x));
              let maxX = Math.max(...absCorners.map(c => c.x));
              let minY = Math.min(...absCorners.map(c => c.y));
              let maxY = Math.max(...absCorners.map(c => c.y));

              let actualW = maxX - minX;
              let actualH = maxY - minY;
              let trueX = minX;
              let trueY = minY;

              const out: any = { 
                id: (Date.now() + Math.floor(Math.random() * 100000)).toString(), 
                style: { 
                  zIndex: zIndex++, 
                  left: trueX.toFixed(2) + 'px', 
                  top: trueY.toFixed(2) + 'px', 
                  width: actualW.toFixed(2) + 'px', 
                  height: actualH.toFixed(2) + 'px' 
                } 
              };
              
              if (el.type === 'barcode' || el.isBarcode || (el.tag && el.tag.isSkuBarCode)) {
                out.type = 'barcode'; 
                out.content = el.text || el.code || '123456';
              } 
              else if (el.type === 'textbox' || el.type === 'text') {
                out.type = 'text'; 
                out.content = el.text || ''; 
                out.fontSize = ((el.fontSize || 14) * (el.scaleY || 1)) + 'px'; 
                out.fontWeight = el.fontWeight === 'bold' ? 'bold' : 'normal';
              } 
              // 🌟 修改点 2：线条的长宽判定改为根据旋转后的真实边界框
              else if (el.type === 'rect' || el.type === 'line') {
                out.type = 'line'; 
                let isVertical = actualH > actualW;
                out.isVertical = isVertical ? 'true' : 'false';
                
                if (isVertical) {
                  out.style.width = '1.5px'; // 竖线固定厚度
                  out.style.height = Math.max(actualH, 1).toFixed(2) + 'px'; // 提取竖线长度
                  out.style.left = (trueX + actualW / 2 - 0.75).toFixed(2) + 'px'; // 抵消极细边框引发的居中偏移
                } else {
                  out.style.height = '1.5px'; // 横线固定厚度
                  out.style.width = Math.max(actualW, 1).toFixed(2) + 'px'; // 提取横线长度
                  out.style.top = (trueY + actualH / 2 - 0.75).toFixed(2) + 'px'; // 抵消极细边框引发的居中偏移
                }
              } 
              else if (el.type === 'image') {
                out.type = 'image'; 
                out.imgUrl = el.url || el.src || ''; 
              }
              return out;
            });
          }
        } catch (err: any) {
          console.error(`\n❌ [ShuaiShou-Convert-Error] 转换数据时发生严重异常！`);
          console.error(`   👉 异常标签名称: ${sourceJson.name || '未命名'}`);
          console.error(`   👉 错误详情: ${err.stack || err.message}`);
          console.error(`   👉 原始报错节点:`, err);
        }
        return outLabel;
      }

      for (const sp of shuaishouPlatforms) {
        console.log(`\n📡 [ShuaiShou] 正在查询平台目录: 【${sp.name}】...`);
        event.sender.send('migration-progress', `正在查询 ${sp.name} 平台模板...`);
        try {
          const listRes = await axios.post('https://dztool.shuaishou.com/api/tool_api/printTemplates/list', {
            pageNo: 1, pageSize: 99999, param: { keyword: "", typeId: sp.typeId, platform: sp.platformId }
          }, { headers });
          
          let items = (listRes.data.code === 0 && listRes.data.data) ? (Array.isArray(listRes.data.data) ? listRes.data.data : (listRes.data.data.list || [])) : [];
          console.log("items",items)
          const ids = items.map((item: any) => item.id);
          console.log("ids",ids)
          if (ids.length === 0) {
            console.log(`⚠️ [ShuaiShou] 【${sp.name}】分类下没有找到模板，跳过。`);
            continue;
          }
          
          console.log(`📦 [ShuaiShou] 在【${sp.name}】分类下共发现 ${ids.length} 个模板，开始逐一抓取详情...`);

          for (let i = 0; i < ids.length; i++) {
            console.log(`⏳ [ShuaiShou] 抓取中 (${i + 1}/${ids.length}) - 模板 ID: ${ids[i]}`);
            event.sender.send('migration-progress', `正在迁移 ${sp.name} (${i + 1}/${ids.length})`);
            
            try {
              // 1. 发起请求
              const detailRes = await axios.get(`https://dztool.shuaishou.com/api/tool_api/printTemplates/detail?id=${ids[i]}`, { headers });
              
              // 🌟 2. 修复了语法错误，这里一定会打印（除非上面的请求报错了）
              console.log("✅ [调试] 接口请求成功，拿到的返回数据是:", detailRes.data);

              if (detailRes.data.code === 0 && detailRes.data.data) {
                const labelName = detailRes.data.data.name || '未命名';
                console.log(`✅ [ShuaiShou] 准备开始转换标签: ${labelName}`);
                
                // 3. 这里才是数据转换
                const converted = convertOldLabelData(detailRes.data.data, sp.name);
                
                if (converted.elements && converted.elements.length > 0) {
                  convertedLabels.push(converted);
                } else {
                  console.warn(`⚠️ [ShuaiShou] 标签转换后为空，已过滤！`);
                }
              }
            } catch (e: any) {
              // 🔴 如果没打印 detailRes，那一定会打印这里的红色报错！
              console.error(`❌ [调试必看] 请求失败，代码跳进了 catch！`);
              console.error(`   👉 错误信息: ${e.message}`);
              if (e.response) {
                console.error(`   👉 服务器状态码: ${e.response.status}`);
                console.error(`   👉 服务器返回的报错内容:`, e.response.data);
              }
            }
            
            await new Promise(r => setTimeout(r, 300));
          }
        } catch (err: any) { 
          console.error(`💥 [ShuaiShou] 查询 ${sp.name} 目录列表请求失败:`, err.message); 
        }
      }
    }
    // ---------------------------------------------------------
    // 🚀 分支 B：佳同工具搬家逻辑
    // ---------------------------------------------------------
    else if (platform === 'jiatong') {
      const headers = { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Authorization': authResult.token 
      };
      const jiatongPlatforms = ['TEMU', 'SHEIN', 'TIKTOK', 'ALIEXPRESS', 'AMAZON'];

      function convertJiatongLabelData(sourceJson: any, targetPlatform: string) {
        const R = 1.25; 
        const fontRatio = 0.85; 
        const outLabel = {
          id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
          name: (sourceJson.name || "导入的标签") + "（佳同）",
          wMM: sourceJson.width || sourceJson.tmWidth || 100,
          hMM: sourceJson.height || sourceJson.tmHeight || 100,
          platform: targetPlatform, elements: [] as any[]
        };
        try {
          if (sourceJson.canvasJSON) {
            const canvasData = JSON.parse(sourceJson.canvasJSON);
            let zIndex = 100;
            if (canvasData.objects && Array.isArray(canvasData.objects)) {
              outLabel.elements = canvasData.objects.map((el: any) => {
                const out: any = { id: (Date.now() + Math.floor(Math.random() * 100000)).toString(), style: { zIndex: zIndex++ } };
                
                let w = (el.width || 0) * (el.scaleX || 1); let h = (el.height || 0) * (el.scaleY || 1);
                if (el.type === 'line' && w === 0 && h === 0) { w = Math.abs((el.x2 || 0) - (el.x1 || 0)) * (el.scaleX || 1); h = Math.abs((el.y2 || 0) - (el.y1 || 0)) * (el.scaleY || 1); }
                
                let rad = (el.angle || 0) * Math.PI / 180; let cos = Math.cos(rad); let sin = Math.sin(rad);
                let px = el.originX === 'center' ? w / 2 : (el.originX === 'right' ? w : 0); let py = el.originY === 'center' ? h / 2 : (el.originY === 'bottom' ? h : 0);
                
                let corners = [{ x: -px, y: -py }, { x: w - px, y: -py }, { x: -px, y: h - py }, { x: w - px, y: h - py }];
                let absCorners = corners.map(c => ({ x: el.left + (c.x * cos - c.y * sin), y: el.top + (c.x * sin + c.y * cos) }));
                
                let minX = Math.min(...absCorners.map(c => c.x)); let maxX = Math.max(...absCorners.map(c => c.x)); let minY = Math.min(...absCorners.map(c => c.y)); let maxY = Math.max(...absCorners.map(c => c.y));
                let actualW = (maxX - minX) * R; let actualH = (maxY - minY) * R; let trueX = minX * R; let trueY = minY * R;

                if (el.type === 'barcode' || el.type === 'BarCode' || el.isBarcode || (el.type === 'image' && el.tag?.isSkuBarCode)) {
                  out.type = 'barcode'; out.content = el.text || el.content || el.code || '123456'; 
                  out.customW = Math.round(w / 7.56) || 70; out.customH = Math.round(h / 7.56) || 20;
                  out.style.width = (out.customW * 7.56).toFixed(2) + 'px'; out.style.height = (out.customH * 7.56).toFixed(2) + 'px'; out.style.left = trueX.toFixed(2) + 'px'; out.style.top = trueY.toFixed(2) + 'px';
                } else if (el.type === 'textbox' || el.type === 'i-text' || el.type === 'text') {
                  out.type = 'text'; out.content = el.text || ''; 
                  let exactFontSize = (el.fontSize || 14) * (el.scaleY || 1) * R * fontRatio; out.fontSize = exactFontSize.toFixed(2) + 'px'; 
                  let isBold = el.fontWeight === 'bold' || String(el.fontWeight) === '700' || Number(el.fontWeight) >= 600 || el.bold === true || el.isBold === true || String(el.fontFamily).toLowerCase().includes('bold') || (el.strokeWidth > 0 && el.stroke && el.stroke !== 'transparent' && el.stroke !== '#ffffff');
                  out.fontWeight = isBold ? 'bold' : 'normal';
                  let widthPadding = exactFontSize * 0.15 + 2; out.style.width = (actualW + widthPadding).toFixed(2) + 'px'; out.style.height = 'auto'; out.style.left = trueX.toFixed(2) + 'px'; out.style.top = trueY.toFixed(2) + 'px'; out.style.lineHeight = el.lineHeight || 1.16; 
                  let isSingleLine = (el.textLines && el.textLines.length === 1) || !out.content.includes('\n');
                  if (isSingleLine) { out.style.whiteSpace = 'nowrap'; } else { out.style.whiteSpace = 'pre-wrap'; out.style.wordBreak = 'break-word'; }
                } else if (el.type === 'rect' || el.type === 'line') {
                  out.type = 'line'; let isVertical = actualH > actualW;
                  if (isVertical) { out.isVertical = 'true'; out.style.width = '1.5px'; out.style.height = actualH.toFixed(2) + 'px'; out.style.left = (trueX + actualW / 2 - 0.75).toFixed(2) + 'px'; out.style.top = trueY.toFixed(2) + 'px'; } 
                  else { out.isVertical = 'false'; out.style.height = '1.5px'; out.style.width = actualW.toFixed(2) + 'px'; out.style.left = trueX.toFixed(2) + 'px'; out.style.top = (trueY + actualH / 2 - 0.75).toFixed(2) + 'px'; }
                } else if (el.type === 'image') {
                  out.type = 'image'; out.imgUrl = el.src || el.url || ''; out.style.width = actualW.toFixed(2) + 'px'; out.style.height = actualH.toFixed(2) + 'px'; out.style.left = trueX.toFixed(2) + 'px'; out.style.top = trueY.toFixed(2) + 'px';
                }
                return out;
              });
            }
          }
        } catch (err: any) { 
          // 🌟 增强版错误日志
          console.error(`\n❌ [JiaTong-Convert-Error] 转换数据时发生严重异常！`);
          console.error(`   👉 异常标签名称: ${sourceJson.name || '未命名'}`);
          console.error(`   👉 错误详情: ${err.stack || err.message}`);
          console.error(`   👉 原始报错节点:`, err);
        }
        return outLabel;
      }

      for (const platName of jiatongPlatforms) {
        console.log(`\n📡 [JiaTong] 正在查询平台目录: 【${platName}】...`);
        event.sender.send('migration-progress', `正在查询 ${platName} 平台模板...`);
        
        try {
          const listParams = new URLSearchParams(); 
          listParams.append('platform', platName); 
          listParams.append('currentPage', '1'); 
          listParams.append('limit', '9999');
          
          const listRes = await axios.post('https://www.tupianfanyi.com/bqConcat/get', listParams, { headers });
          
          const lists = listRes.data?.data?.lists;
          if (!lists || !Array.isArray(lists) || lists.length === 0) {
            console.log(`⚠️ [JiaTong] 【${platName}】分类下没有找到模板数据，直接跳过并查询下一个。`);
            continue; 
          }
          
          console.log(`📦 [JiaTong] 在【${platName}】分类下共发现 ${lists.length} 个模板，开始逐一抓取详情...`);
          
          for (let i = 0; i < lists.length; i++) {
            const mainid = lists[i].mainid || lists[i].mainId || lists[i]._id; 
            if (!mainid) continue;
            
            console.log(`⏳ [JiaTong] 抓取中 (${i + 1}/${lists.length}) - 模板 ID: ${mainid}`);
            event.sender.send('migration-progress', `正在迁移 ${platName} (${i + 1}/${lists.length})`);
            
            try {
              const detailParams = new URLSearchParams(); 
              detailParams.append('id', mainid);
              
              const detailRes = await axios.post('https://www.tupianfanyi.com/bqConcat/getById', detailParams, { headers });
              
              if (detailRes.data?.data) { 
                const labelName = detailRes.data.data.name || '未命名';
                console.log(`✅ [JiaTong] 详情获取成功，开始转换: ${labelName}`);
                
                const converted = convertJiatongLabelData(detailRes.data.data, platName); 
                
                // 🌟 新增空元素过滤
                if (converted.elements && converted.elements.length > 0) {
                  convertedLabels.push(converted);
                } else {
                  console.warn(`⚠️ [JiaTong-Empty-Warning] 标签【${labelName}】转换后内容为空 (可能无法解析或原模板就是空的)，已自动过滤跳过！`);
                }
              } else {
                console.warn(`❌ [JiaTong] 详情获取失败，跳过此条:`, detailRes.data);
              }
            } catch (e: any) {
              console.error(`❌ [JiaTong] 抓取单条详情时发生网络错误，跳过此条:`, e.message);
            }
            await new Promise(r => setTimeout(r, 300)); 
          }
        } catch (err: any) { 
          console.error(`💥 [JiaTong] 查询 ${platName} 目录列表失败，跳过该平台:`, err.message); 
        }
      }
    }

    console.log(`\n🎉 [Migration] 搬家任务全部结束！`);
    console.log(`🎉 [Migration] 共成功转换并保留了 ${convertedLabels.length} 个有效标签。`);
    return convertedLabels;

  } catch (error: any) {
    console.error(`💥 [Migration] 核心执行过程发生致命错误:`, error.stack || error.message);
    throw new Error('抓取过程发生错误: ' + error.message);
  }
}

// ======================================================================
// 🚀 主路由：强制每次打开内部浏览器获取最新 Token (修复了前后端通信格式)
// ======================================================================
ipcMain.handle('migrate-labels', async (event, platform: string) => {
  return new Promise(async (resolve, reject) => {
    
    console.log(`\n======================================================`);
    console.log(`🖥️  [Migrate-Init] 收到前端请求，准备开启内置浏览器...`);
    console.log(`🖥️  [Migrate-Init] 目标平台: ${platform}`);
    
    let targetUrl = platform === 'shuaishou' ? 'https://dztool.shuaishou.com/' : 'https://jiatongkuajing.com/';
    let targetTitle = platform === 'shuaishou' ? '登录甩手打印工具' : '登录佳同跨境工具';

    const migrateWin = new BrowserWindow({
      width: 1000, height: 700, title: targetTitle, show: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, partition: 'persist:store' }
    });
    
    migrateWin.loadURL(targetUrl);
    
    let pollInterval: NodeJS.Timeout;
    let hasStartedMigration = false;

    const checkToken = async () => {
      if (migrateWin.isDestroyed()) return null;
      try {
        if (platform === 'shuaishou') {
          return await migrateWin.webContents.executeJavaScript(`
            (function() {
              const userStoreStr = window.localStorage.getItem('userStore');
              if (!userStoreStr) return null;
              const userStore = JSON.parse(userStoreStr);
              if (!userStore.token) return null;
              return { token: userStore.token, tokenKey: userStore.tokenKey };
            })();
          `);
        } else if (platform === 'jiatong') {
          return await migrateWin.webContents.executeJavaScript(`
            (function() {
              const token = window.localStorage.getItem('token') || window.sessionStorage.getItem('token');
              if (!token) return null;
              return { token: token };
            })();
          `);
        }
      } catch (e) { return null; }
    };

    pollInterval = setInterval(async () => {
      if (hasStartedMigration || migrateWin.isDestroyed()) {
        clearInterval(pollInterval);
        return;
      }
      
      const authResult = await checkToken();
      if (authResult) {
        clearInterval(pollInterval);
        hasStartedMigration = true;
        
        console.log(`🔑 [Migrate-Init] 从内置浏览器成功提取到实时 Token，准备开始抓取...`);
        event.sender.send('save-migration-auth', { platform, auth: authResult });
        
        if (!migrateWin.isDestroyed()) migrateWin.close(); 
        
        try {
          // 拿到数组形式的抓取结果
          const extractedLabels = await executeMigration(platform, authResult, event);
          
          // 🌟 核心修复：包装成前端 Vue 需要的对象格式！
          resolve({ 
            success: true, 
            labels: extractedLabels 
          });
          
        } catch (e: any) {
          // 发生异常时也返回标准的错误对象
          resolve({ 
            success: false, 
            error: e.message 
          });
        }
      } else {
        event.sender.send('migration-progress', 'WAITING_LOGIN');
        const injectTipScript = `
          if (!document.getElementById('easy-label-login-tip')) {
            const tip = document.createElement('div');
            tip.id = 'easy-label-login-tip';
            tip.style.cssText = 'position:fixed; top:24px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color:#fff; padding:16px 32px; border-radius:16px; z-index:2147483647; font-family:sans-serif; font-size:16px; font-weight:bold; box-shadow:0 10px 25px -5px rgba(79, 70, 229, 0.4); pointer-events:none; text-align:center; animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1);';
            const style = document.createElement('style');
            style.innerHTML = '@keyframes slideDown { from { top: -50px; opacity: 0; } to { top: 24px; opacity: 1; } }';
            document.head.appendChild(style);
            tip.innerHTML = '✨ 易标签助手：请在此窗口登录目标系统<br><span style="font-size:13px; font-weight:normal; opacity:0.9; margin-top:6px; display:inline-block;">登录成功后，此窗口将自动关闭并开始极速搬家</span>';
            document.body.appendChild(tip);
          }
        `;
        migrateWin.webContents.executeJavaScript(injectTipScript).catch(() => {});
      }
    }, 1500);
  });
});