const { app, BrowserWindow, desktopCapturer, ipcMain, screen } = require('electron')
const path = require('path')
const { mouse, keyboard, Point, Button, Key } = require("@mintplex-labs/nut-js")

let mainWindow;
let allowControl = false; // Permission gate

// Disable visual feedback for performance
mouse.config.mouseSpeed = 10000;
keyboard.config.autoDelayMs = 0;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 380,
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
  'Enter': Key.Enter,
  'Backspace': Key.Backspace,
  'Tab': Key.Tab,
  'Escape': Key.Escape,
  ' ': Key.Space,
  'ArrowUp': Key.Up,
  'ArrowDown': Key.Down,
  'ArrowLeft': Key.Left,
  'ArrowRight': Key.Right,
  'Control': Key.LeftControl,
  'Shift': Key.LeftShift,
  'Alt': Key.LeftAlt,
  'Meta': Key.LeftSuper,
  'a': Key.A, 'b': Key.B, 'c': Key.C, 'd': Key.D, 'e': Key.E, 'f': Key.F, 'g': Key.G,
  'h': Key.H, 'i': Key.I, 'j': Key.J, 'k': Key.K, 'l': Key.L, 'm': Key.M, 'n': Key.N,
  'o': Key.O, 'p': Key.P, 'q': Key.Q, 'r': Key.R, 's': Key.S, 't': Key.T, 'u': Key.U,
  'v': Key.V, 'w': Key.W, 'x': Key.X, 'y': Key.Y, 'z': Key.Z
};

ipcMain.on('key-event', async (event, data) => {
  if (!allowControl) return;
  try {
    const key = keyMap[data.key.toLowerCase()] || data.key;
    if (data.action === 'down') {
      await keyboard.pressKey(key);
    } else {
      await keyboard.releaseKey(key);
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
