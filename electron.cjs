// Author  : Gaston Gonzalez
// Date    : 14 July 2025
// Updated : 23 July 2025
// Purpose : Main entry point for the Electron application

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
    },
  });

  // Set zoom level for app one level higher than 100% since we targeting
  // touch devices in EmComm Tools Community.
  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomFactor(1.2);
  });

  // production
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // dev
  //win.loadURL('http://localhost:5173');

  // Define your menu template
  const menuTemplate = [
    {
      label: 'File',
      submenu: [{ role: 'quit' }]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ];

  // Remove "Help" from menu for now
  const menu = Menu.buildFromTemplate(
    menuTemplate.filter(item => item.label !== 'Help')
  );

  Menu.setApplicationMenu(menu);

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
