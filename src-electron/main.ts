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
    console.log('当前设备生成的底层 ID:', deviceId); // 您可以在控制台看到这个极其安全的 ID

    const response = await fetch('https://easylabel-auth.zhlon0612.workers.dev/share/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, deviceId })
    });

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('卡密验证网络错误:', error);
    return { error: '网络连接失败，请检查网络后重试' };
  }
});

// 2. 监听：设备解绑 / 换机
ipcMain.handle('unbind-license', async (event, key: string) => {
  try {
    const deviceId = generateHardDeviceId();

    const response = await fetch('https://easylabel-auth.zhlon0612.workers.dev/share/unbind', {
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
ipcMain.handle('get-device-id', () => {
  return generateHardDeviceId();
});