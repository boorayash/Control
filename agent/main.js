const { app, BrowserWindow, desktopCapturer, ipcMain, screen, clipboard } = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { mouse, keyboard, Point, Button, Key } = require("@mintplex-labs/nut-js")

let mainWindow;
let allowControl = false; // Permission gate
let roomId = null;

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
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadFile('index.html')

  mainWindow.webContents.on('did-finish-load', async () => {
    // Send room ID first
    mainWindow.webContents.send('set-room-id', roomId);
    
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

// IPC Handlers for Remote Control
ipcMain.on('mouse-move', async (event, data) => {
  if (!allowControl) return;
  try {
    const { width, height } = screen.getPrimaryDisplay().bounds;
    const x = data.x * width;
    const y = data.y * height;
    await mouse.setPosition(new Point(x, y));
  } catch (err) {
    console.error('[Agent] Mouse move error:', err);
  }
});

ipcMain.on('mouse-click', async (event, data) => {
  if (!allowControl) return;
  try {
    const { width, height } = screen.getPrimaryDisplay().bounds;
    const x = data.x * width;
    const y = data.y * height;
    
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

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
