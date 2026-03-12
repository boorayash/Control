const { app, BrowserWindow, desktopCapturer, ipcMain, screen } = require('electron')
const path = require('path')
const { mouse, keyboard, Point, Button, Key } = require("@mintplex-labs/nut-js")

let mainWindow;

// Disable visual feedback (cursor movements/typing delay) for better performance
mouse.config.mouseSpeed = 10000;
keyboard.config.autoDelayMs = 0;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadFile('index.html')

  mainWindow.webContents.on('did-finish-load', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] });
    if (sources.length > 0) {
      // Pick the first screen (usually the primary display)
      mainWindow.webContents.send('set-source', sources[0].id);
    }
  });
}

// IPC Handlers for Remote Control
ipcMain.on('mouse-move', async (event, data) => {
  const { width, height } = screen.getPrimaryDisplay().bounds;
  const x = data.x * width;
  const y = data.y * height;
  await mouse.setPosition(new Point(x, y));
});

ipcMain.on('mouse-click', async (event, data) => {
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
});

// Map standard keys to nut-js Keys
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
  'Meta': Key.LeftSuper
};

ipcMain.on('key-event', async (event, data) => {
  try {
    const key = keyMap[data.key] || data.key.toUpperCase();
    if (data.action === 'down') {
      await keyboard.pressKey(key);
    } else {
      await keyboard.releaseKey(key);
    }
  } catch (e) {
    console.error("Key event error:", e);
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
