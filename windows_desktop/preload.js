const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  platform: 'windows',
  isDesktop: true,
  printTicket: () => ipcRenderer.send('print-ticket'),
  printInvoice: () => ipcRenderer.send('print-invoice'),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close')
});
