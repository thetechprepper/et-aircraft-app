// electron.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
    },
  });

  // production
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // dev
  //win.loadURL('http://localhost:5173');

  win.maximize();
  win.show();
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
