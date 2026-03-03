import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';

// 禁用 Electron 默认的安全警告提示（因为我们需要解除跨域限制）
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

// 声明主窗口变量，防止被垃圾回收机制意外清理
let mainWindow: BrowserWindow | null = null;

/**
 * 创建并初始化应用主窗口
 */
function createWindow() {
  // 动态计算应用图标路径 (开发环境取 public 源码，生产环境取 dist 打包结果)
  const iconPath = process.env.VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public/icon.ico') 
    : path.join(__dirname, '../dist/icon.ico');

  // 初始化浏览器窗口实例
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Easy Label',
    icon: iconPath, 
    autoHideMenuBar: true, // 隐藏 Windows/Linux 顶部的传统菜单栏，让界面更现代化
    webPreferences: {
      nodeIntegration: true,    // 允许在前端代码中直接使用 Node.js API
      contextIsolation: false,  // 关闭上下文隔离，方便 Vue 直接与 Electron 主进程通信
      webSecurity: false,       // 彻底解除跨域限制（方便加载各种外部图片和请求接口）
      devTools: false,          // 生产环境默认禁用开发者工具
    },
  });

  // 判断当前运行环境
  if (process.env.VITE_DEV_SERVER_URL) {
    // 开发环境：加载 Vite 启动的本地服务地址 (支持热更新 HMR)
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // 生产环境：加载打包后的 index.html
    const htmlPath = path.join(__dirname, '../dist/index.html');
    
    if (fs.existsSync(htmlPath)) {
      mainWindow.loadFile(htmlPath);
    } else {
      // 容错处理：如果文件丢失，显示错误页面而不是白屏
      mainWindow.loadURL(`data:text/html;charset=utf-8,<h1>File Not Found: index.html</h1>`);
    }
  }

  // 监听开发者工具打开事件并强制关闭（防抓包/防调试保护）
  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow?.webContents.closeDevTools();
  });

  // 监听窗口关闭事件，释放内存
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 当 Electron 底层初始化完成时，创建窗口
app.whenReady().then(() => {
  createWindow();

  // 针对 macOS 的特殊处理：当点击 Dock 图标且没有其他窗口打开时，重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 监听所有窗口关闭事件
app.on('window-all-closed', () => {
  // 针对 macOS 的特殊处理：通常用户关闭窗口不代表退出程序，按 Cmd+Q 才会真正退出
  if (process.platform !== 'darwin') {
    app.quit();
  }
});