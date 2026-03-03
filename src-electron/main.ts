import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { generateHardDeviceId } from './hardwareId'; // 引入硬件ID生成器

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 在开发环境下自动打开控制台，方便排查报错和网络请求
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
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

// 1. 监听：卡密登录验证
ipcMain.handle('verify-license', async (event, key: string) => {
  try {
    const deviceId = generateHardDeviceId();
    console.log('✅ 底层设备 ID 生成成功:', deviceId);

    // ⚠️ 重点 1：请务必确保下面这个地址是您真实的 Cloudflare Worker 域名！
    // 如果您还在用我写的假地址 api.easylabel.cloud，这里一定会请求失败。
    const apiUrl = 'https://api.easylabel.cloud/verify'; 
    console.log('👉 正在请求云端:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, deviceId })
    });

    console.log('☁️ HTTP 状态码:', response.status);

    // ⚠️ 重点 2：不要直接 .json()，我们先把它当作纯文本拿出来看！
    // 这样即使 Cloudflare 报错拦截了，我们也能看到完整的报错网页内容
    const rawText = await response.text();
    console.log('📦 云端返回的原始数据:', rawText);

    // 尝试将返回的数据解析为 JSON
    const result = JSON.parse(rawText);
    return result;

  } catch (error: any) {
    console.error('❌ 底层请求彻底崩溃:', error);
    // 把真实的报错原因返回给前端
    return { error: '网络或解析异常: ' + error.message };
  }
});

// 2. 监听：设备解绑 / 换机
ipcMain.handle('unbind-license', async (event, key: string) => {
  try {
    const deviceId = generateHardDeviceId();

    const response = await fetch('https://api.easylabel.cloud/unbind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, deviceId })
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('卡密解绑网络错误:', error);
    return { error: '网络连接失败，请检查网络后重试' };
  }
});

// 3. 监听：获取设备ID
ipcMain.handle('get-device-id', () => {
  return generateHardDeviceId();
});

// 4. 监听：纯设备码静默登录 (无需前端提供卡密)
ipcMain.handle('auto-login', async () => {
  try {
    const deviceId = generateHardDeviceId();
    
    // 注意：替换为您真实的 API 地址
    const response = await fetch('https://api.easylabel.cloud/auto-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });

    const result = await response.json();
    return result;

  } catch (error: any) {
    console.error('自动登录网络错误:', error);
    return { error: '网络连接失败，请检查网络后重试' };
  }
});