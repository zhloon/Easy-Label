import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import axios from 'axios'; // 🌟 引入 axios
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
    // 防止网络被劫持或 Cloudflare 弹出验证页
    if (typeof res.data === 'string') {
      return { success: false, error: '服务器返回格式异常，请检查网络' };
    }
    return res.data;
  },
  (error) => {
    console.error('❌ [Main API Error]:', error.message);
    // 🌟 核心：直接 resolve 错误对象给前端 IPC，防止底层直接抛红字奔溃
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
    // 🌟 1. 运行时窗口图标：Windows 用 ico，macOS/Linux 用 png
    icon: path.join(publicPath, process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
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
  const deviceId = generateHardDeviceId();
  console.log(`👉 [API] 正在验证设备: ${deviceId}`);
  // 🌟 代码极度清爽：一行代码发起请求，拦截器自动处理返回和错误
  return await apiClient.post('/api/verify', { key, deviceId });
});

// 2. 监听：设备解绑 / 换机
ipcMain.handle('unbind-license', async (event, key: string) => {
  const deviceId = generateHardDeviceId();
  console.log(`👉 [API] 正在申请解绑设备: ${deviceId}`);
  return await apiClient.post('/api/unbind', { key, deviceId });
});

// 3. 监听：获取设备ID
ipcMain.handle('get-device-id', () => generateHardDeviceId());

// 4. 监听：纯设备码静默登录 (无需前端提供卡密)
ipcMain.handle('auto-login', async () => {
  const deviceId = generateHardDeviceId();
  console.log(`👉 [API] 正在静默登录设备: ${deviceId}`);
  return await apiClient.post('/api/auto-login', { deviceId });
});
// ==========================================
// 🌟 新增：角标 (Badge) 控制 IPC 接口
// ==========================================
ipcMain.handle('set-badge', (event, count: number) => {
  // 设置任务栏/Dock栏的数字角标 (传入 0 会自动隐藏角标)
  app.setBadgeCount(count);
  return { success: true };
});