import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import axios from 'axios';
import { generateHardDeviceId } from './hardwareId';
import { executeMigration, createMigrationWindow, checkLoginStatus, injectLoginTip } from './migration';

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
// 🚀 主路由：支持前端传入本地存储的 Token (实现免弹窗闭环)
// ======================================================================
ipcMain.handle('migrate-labels', async (event, platform: string, storedAuth?: any) => {
  return new Promise(async (resolve, reject) => {
    
    // 🌟 1. 优先使用前端传入的本地 Token
    if (storedAuth && storedAuth.token) {
      console.log(`✅ [Migrate] 检测到 ${platform} 本地授权，正在静默抓取...`);
      try {
        const result = await executeMigration(platform, storedAuth, event);
        return resolve(result); 
      } catch (e) {
        console.warn('本地 Token 可能已过期，回退到登录弹窗模式');
      }
    }

    // 🌟 2. 如果无 Token 或已过期，弹出窗口要求登录
    const migrateWin = createMigrationWindow(platform);
    const targetUrl = platform === 'shuaishou' ? 'https://dztool.shuaishou.com/' : 'https://jiatongkuajing.com/';
    
    migrateWin.loadURL(targetUrl);
    
    migrateWin.webContents.on('did-finish-load', () => {
      console.log(`✅ [Migration] 窗口加载完成，开始检查登录状态...`);
    });
    
    migrateWin.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`❌ [Migration] 窗口加载失败: ${errorDescription} (${errorCode})`);
    });

    let pollInterval: NodeJS.Timeout;
    let hasStartedMigration = false;

    const checkToken = async () => {
      if (migrateWin.isDestroyed()) return null;
      return await checkLoginStatus(platform, migrateWin);
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
        
        if (!migrateWin.isDestroyed()) migrateWin.close(); 
        
        try {
          const result = await executeMigration(platform, authResult, event);
          resolve(result);
        } catch (e: any) {
          reject(e.message);
        }
      } else {
        if (!migrateWin.isVisible()) {
          migrateWin.show();
          event.sender.send('migration-progress', 'WAITING_LOGIN');
          injectLoginTip(migrateWin, platform);
        }
      }
    }, 1500);
  });
});