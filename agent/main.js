const { app, BrowserWindow, desktopCapturer, ipcMain, screen, clipboard, Tray, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { mouse, keyboard, Point, Button, Key } = require("@mintplex-labs/nut-js")
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (e) {
  console.log('[Agent] dotenv not found, using system/default env');
}

let mainWindow;
let allowControl = true; // Permission gate - Default to ON
let roomId = null;
let tray = null;

// Disable visual feedback for performance
mouse.config.mouseSpeed = 10000;
keyboard.config.autoDelayMs = 0;

// --- Persistent Room ID ---
function getConfigPath() {
  return path.join(app.getPath('userData'), 'control-config.json');
}

function loadOrCreateRoomId() {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.roomId) {
        console.log(`[Agent] Loaded Room ID: ${config.roomId}`);
        return config.roomId;
      }
    }
  } catch (e) {
    console.error('[Agent] Config read error, regenerating:', e.message);
  }
  // Generate a new permanent ID: CTL-XXXXXX
  const id = 'CTL-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  try {
    fs.writeFileSync(configPath, JSON.stringify({ roomId: id }, null, 2));
    console.log(`[Agent] Generated new Room ID: ${id}`);
  } catch (e) {
    console.error('[Agent] Config save error:', e.message);
  }
  return id;
}

// Copy Room ID to clipboard
ipcMain.on('copy-room-id', () => {
  if (roomId) {
    clipboard.writeText(roomId);
    console.log('[Agent] Room ID copied to clipboard');
  }
});

function createWindow () {
  roomId = loadOrCreateRoomId();

  mainWindow = new BrowserWindow({
    width: 360,
    height: 460,
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#020617',
    icon: path.join(__dirname, 'logo.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadFile('index.html')

  mainWindow.webContents.on('did-finish-load', async () => {
    // Send room ID first
    mainWindow.webContents.send('set-room-id', roomId);

    // Send server URL from environment
    const serverUrl = process.env.SIGNALING_SERVER_URL || 'https://unintegrated-mei-glibly.ngrok-free.dev';
    mainWindow.webContents.send('set-server-url', serverUrl);
    
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    if (sources.length > 0) {
      mainWindow.webContents.send('set-source', sources[0].id);
    }
  });
}

// Permission Management
ipcMain.on('update-permissions', (event, data) => {
  allowControl = data.allowControl;
  console.log(`[Agent] Remote Control: ${allowControl ? 'ENABLED' : 'DISABLED'}`);
});

ipcMain.on('mouse-move', async (event, data) => {
  if (!allowControl) return;
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const scale = primaryDisplay.scaleFactor;
    const { width, height } = primaryDisplay.bounds;
    
    // Scale up for logical -> physical pixels
    const physicalWidth = width * scale;
    const physicalHeight = height * scale;
    
    const x = data.x * physicalWidth;
    const y = data.y * physicalHeight;
    await mouse.setPosition(new Point(x, y));
  } catch (err) {
    console.error('[Agent] Mouse move error:', err);
  }
});

ipcMain.on('mouse-click', async (event, data) => {
  if (!allowControl) return;
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const scale = primaryDisplay.scaleFactor;
    const { width, height } = primaryDisplay.bounds;
    
    const physicalWidth = width * scale;
    const physicalHeight = height * scale;
    const x = data.x * physicalWidth;
    const y = data.y * physicalHeight;
    
    await mouse.setPosition(new Point(x, y));
    const button = data.button === 'right' ? Button.RIGHT : Button.LEFT;
    
    if (data.action === 'down') {
      await mouse.pressButton(button);
    } else {
      await mouse.releaseButton(button);
    }
  } catch (err) {
    console.error('[Agent] Mouse click error:', err);
  }
});

// Improved key mapping
const keyMap = {
  'enter': Key.Enter,
  'backspace': Key.Backspace,
  'tab': Key.Tab,
  'escape': Key.Escape,
  ' ': Key.Space,
  'arrowup': Key.Up,
  'arrowdown': Key.Down,
  'arrowleft': Key.Left,
  'arrowright': Key.Right,
  'control': Key.LeftControl,
  'shift': Key.LeftShift,
  'alt': Key.LeftAlt,
  'meta': Key.LeftSuper,
  // Numbers & Symbols (Primary)
  '0': Key.Num0, '1': Key.Num1, '2': Key.Num2, '3': Key.Num3, '4': Key.Num4,
  '5': Key.Num5, '6': Key.Num6, '7': Key.Num7, '8': Key.Num8, '9': Key.Num9,
  '-': Key.Minus, '=': Key.Equal, '[': Key.LeftBracket, ']': Key.RightBracket,
  ';': Key.Semicolon, "'": Key.Quote, ',': Key.Comma, '.': Key.Period, '/': Key.Slash,
  '\\': Key.Backslash, '`': Key.Grave,
  // Alphabet
  'a': Key.A, 'b': Key.B, 'c': Key.C, 'd': Key.D, 'e': Key.E, 'f': Key.F, 'g': Key.G,
  'h': Key.H, 'i': Key.I, 'j': Key.J, 'k': Key.K, 'l': Key.L, 'm': Key.M, 'n': Key.N,
  'o': Key.O, 'p': Key.P, 'q': Key.Q, 'r': Key.R, 's': Key.S, 't': Key.T, 'u': Key.U,
  'v': Key.V, 'w': Key.W, 'x': Key.X, 'y': Key.Y, 'z': Key.Z
};

ipcMain.on('key-event', async (event, data) => {
  if (!allowControl) return;
  try {
    const rawKey = data.key.toLowerCase();
    const key = keyMap[rawKey];
    
    if (key !== undefined) {
      if (data.action === 'down') {
        try {
          await keyboard.pressKey(key);
        } catch (err) {
          console.warn(`[Agent] pressKey failed for ${rawKey}:`, err.message);
          // Fallback to type if pressKey fails for certain keys
          if (data.key.length === 1) await keyboard.type(data.key);
        }
      } else {
        try {
          await keyboard.releaseKey(key);
        } catch (err) { /* ignore release errors */ }
      }
    } else if (data.action === 'down' && data.key.length === 1) {
      await keyboard.type(data.key);
    }
  } catch (e) {
    console.error("[Agent] Key event error:", e);
  }
});

// --- Session Tray Management ---
ipcMain.on('session-started', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
  if (!tray) {
    const { nativeImage } = require('electron');
    const logoPath = path.join(__dirname, 'logo.png');
    let trayIcon;
    try {
      trayIcon = nativeImage.createFromPath(logoPath).resize({ width: 16, height: 16 });
    } catch (e) {
      trayIcon = nativeImage.createEmpty();
    }
    tray = new Tray(trayIcon);
    
    tray.setToolTip('Control Agent - Live Session');
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open Dashboard', click: () => { if (mainWindow) mainWindow.show(); } },
      { label: 'Quit Control Agent', click: () => { app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);
    
    tray.on('click', () => {
      if (mainWindow) mainWindow.show();
    });
  }
});

ipcMain.on('session-ended', () => {
  if (mainWindow) {
    mainWindow.show();
  }
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
