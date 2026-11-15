const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
const PORT = 3500;
const SERVER_URL = `http://localhost:${PORT}`;

function isServerRunning(callback) {
  const req = http.get(SERVER_URL, (res) => {
    callback(true);
  });
  req.on('error', () => {
    callback(false);
  });
  req.setTimeout(800, () => {
    req.abort();
    callback(false);
  });
}

function startEmbeddedServer(onReady) {
  isServerRunning((running) => {
    if (running) {
      console.log(`[Desktop] Serveur local déjà actif sur le port ${PORT}.`);
      onReady();
    } else {
      console.log(`[Desktop] Démarrage du serveur embarqué interne...`);
      try {
        require(path.join(__dirname, 'server.js'));
      } catch (err) {
        console.error('[Desktop] Erreur chargement server.js:', err);
      }
      setTimeout(onReady, 500);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 980,
    minHeight: 600,
    title: 'Caisse & Facturation - Librairie Papeterie Ouaga (100% Hors-Ligne)',
    backgroundColor: '#0a0f1d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const menuTemplate = [
    {
      label: 'Caisse & Vente',
      submenu: [
        {
          label: 'Caisse Express (F1)',
          accelerator: 'F1',
          click: () => {
            mainWindow.webContents.executeJavaScript("document.querySelector('[data-tab=\"caisse\"]')?.click();");
          }
        },
        {
          label: 'Factures A4 Pro (F3)',
          accelerator: 'F3',
          click: () => {
            mainWindow.webContents.executeJavaScript("document.querySelector('[data-tab=\"factures\"]')?.click();");
          }
        },
        { type: 'separator' },
        {
          label: 'Imprimer Ticket / Facture',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.print({ silent: false, printBackground: true });
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser (F5)' },
        { role: 'forceReload', label: 'Actualisation forcée' },
        { role: 'toggleDevTools', label: 'Outils de diagnostic' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom par défaut' },
        { role: 'zoomIn', label: 'Agrandir' },
        { role: 'zoomOut', label: 'Réduire' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein Écran (F11)' }
      ]
    },
    {
      label: 'Aide & Mode Hors-Ligne',
      submenu: [
        {
          label: 'Mode Délestage Sonabel (Actif 100% Hors-Ligne)',
          click: () => {
            mainWindow.webContents.executeJavaScript("alert('Mode Hors-Ligne Garanti : Toutes vos ventes et stocks sont enregistrés directement sur ce PC.');");
          }
        },
        {
          label: 'À propos - Barouba Group',
          click: () => {
            mainWindow.webContents.executeJavaScript("alert('Système de Caisse et Facturation A4 Professionnel\\nConçu pour les Librairies et Papeteries de Ouagadougou\\nVersion 1.0.0 Native Windows (Offline-First)');");
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.loadURL(SERVER_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers pour impression native et fenêtre
ipcMain.on('print-ticket', (event) => {
  if (mainWindow) {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      pageSize: 'A6'
    });
  }
});

ipcMain.on('print-invoice', (event) => {
  if (mainWindow) {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      pageSize: 'A4'
    });
  }
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());

app.whenReady().then(() => {
  startEmbeddedServer(() => {
    createWindow();
  });

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
