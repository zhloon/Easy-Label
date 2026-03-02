import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // ★ 动态计算图标路径：开发环境取 public，打包后取 dist
  const iconPath = process.env.VITE_DEV_SERVER_URL
    ? path.join(__dirname, '../public/icon.ico') 
    : path.join(__dirname, '../dist/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Easy Label',
    icon: iconPath, // ★ 新增：设置运行时的窗口左上角及任务栏图标
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      devTools: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const htmlPath = path.join(__dirname, '../dist/index.html');
    
    if (fs.existsSync(htmlPath)) {
      mainWindow.loadFile(htmlPath);
    } else {
      mainWindow.loadURL(`data:text/html;charset=utf-8,<h1>File Not Found</h1>`);
    }
  }

  mainWindow.webContents.on('devtools-opened', () => {
    mainWindow?.webContents.closeDevTools();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});