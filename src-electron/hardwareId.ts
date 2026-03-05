import { execSync } from 'child_process';
import { createHash } from 'crypto';
import os from 'os';

/**
 * 执行系统命令并忽略报错
 */
function getCommandOutput(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return '';
  }
}

/**
 * 获取物理机底层绝对唯一的 UUID
 */
function getSystemUUID(): string {
  let uuid = '';
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: 获取主板 UUID
    const output = getCommandOutput('wmic csproduct get uuid');
    uuid = output.split('\n')[1]?.trim() || '';
  } else if (platform === 'darwin') {
    // macOS: 获取硬件 IOPlatformUUID
    const output = getCommandOutput('ioreg -rd1 -c IOPlatformExpertDevice');
    const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
    if (match) uuid = match[1];
  } else if (platform === 'linux') {
    // Linux: 获取 machine-id
    uuid = getCommandOutput('cat /var/lib/dbus/machine-id') || getCommandOutput('cat /etc/machine-id');
  }

  return uuid.toLowerCase();
}

/**
 * 降级方案：如果获取不到底层 UUID，获取系统首个有效物理网卡的 MAC 地址
 */
function getMacAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const info of iface) {
      if (!info.internal && info.mac !== '00:00:00:00:00:00') {
        return info.mac;
      }
    }
  }
  return '';
}

/**
 * 🌟 生成极其严密的设备指纹
 */
export function generateHardDeviceId(): string {
  let hardwareId = getSystemUUID();
  
  // 如果当前系统权限不足导致拿不到主板 UUID，则用 Mac地址 + 计算机名 作为备用唯一指纹
  if (!hardwareId || hardwareId.includes('ffffffff')) {
    hardwareId = getMacAddress() + '_' + os.hostname();
  }

  // 加盐并生成不可逆的 SHA-256 哈希值
  const salt = 'easylabel_pro_v2_';
  return createHash('sha256').update(salt + hardwareId).digest('hex');
}