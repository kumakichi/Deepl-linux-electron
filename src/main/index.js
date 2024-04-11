let url = '';
let URL = require('url');
let path = require('path');
let fs = require('fs')

let gShortcut;

let isRemoveLineBreaks = false;
let isHiddenOnStartup = false;
let windowWidth = 800;
let windowHeight = 600;

const Store = require('electron-store');
const store = new Store();

const {
    app,
    BrowserView,
    BrowserWindow,
    dialog,
    globalShortcut,
    ipcMain,
    Menu,
    shell,
    nativeImage,
    Tray
} = require('electron');
var win = null;
var appQuitting = false;
const appName = 'Deepl-Linux-Electron';

app.setAboutPanelOptions({
    applicationName: appName,
    applicationVersion: app.getVersion(),
    copyright: '© 2021-2024 kumakichi'
})


app.on('ready', function() {
    let Menu = require('electron').Menu;
    isRemoveLineBreaks = store.get('remove_line_breaks');
    isHiddenOnStartup = store.get('hidden_on_startup');
    windowWidth = store.get('window_width');
    windowHeight = store.get('window_height');
    let templateArr = [{
        label: "Settings",
        submenu: [{
            label: "Shortcut",
            click: () => {
                const hotkeySettingsWindow = new BrowserWindow({
                    frame: false,
                    height: 50,
                    width: 280,
                    webPreferences: {
                        nodeIntegration: true,
                        enableRemoteModule: true // renderer的remote需要这个: https://github.com/electron/electron/issues/16558#issuecomment-703143446
                    }
                })
                //                        hotkeySettingsWindow.webContents.openDevTools();

                hotkeySettingsWindow.loadFile(path.join(__static, 'hotkey.html'))
            }
        }, {
          label: "Window size",
          click: () => {
              const settingsWindowSize = new BrowserWindow({
                  frame: false,
                  height: 125,
                  width: 200,
                  webPreferences: {
                      nodeIntegration: true,
                      enableRemoteModule: true
                  }
              })
              settingsWindowSize.loadFile(path.join(__static, 'window-size.html'))
          }
        }, {
            label: "Remove Line Breaks",
            type: "checkbox",
            checked: isRemoveLineBreaks,
            click: (item) => {
                isRemoveLineBreaks = item.checked;
                store.set('remove_line_breaks', isRemoveLineBreaks);
                win.webContents.send('translateClipboard', item.checked);
            }
        }, {
            label: "Hidden on startup",
            type: "checkbox",
            checked: isHiddenOnStartup,
            click: (item) => {
                isHiddenOnStartup = item.checked;
                store.set('hidden_on_startup', isHiddenOnStartup);
            }
        }, {
            label: "Quit",
            role: 'quit'
        }]
    }, {
        label: "Help",
        submenu: [{
            label: "Learn More",
            click: async () => {
                await shell.openExternal('https://github.com/kumakichi/Deepl-linux-electron')
            }
        }, {
            label: "About",
            click: async () => {
                await app.showAboutPanel();
            }
        }]
    }];
    if (process.platform === 'darwin') {
        templateArr.unshift({
            label: ''
        })
    }
    let menu = Menu.buildFromTemplate(templateArr);
    Menu.setApplicationMenu(menu);

    tray = new Tray(nativeImage.createFromPath(path.join(__static,'tray-icon.png')))
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Quit',
            click() {
                appQuitting = true
                app.quit()
            }
        }
    ])
    tray.setToolTip('Deepl-Linux-Electron')
    tray.setContextMenu(contextMenu)

    let ss = store.get('short_key');
    if (!ss) {
        console.log("========>not found, fill with default");
        store.set('short_key', 'Control+Alt+D');
    }
    gShortcut = store.get('short_key');
    console.log("============ use shortKey:", gShortcut);
    registerShortcut(gShortcut);

    win = new BrowserWindow({
        title: "Deepl-Linux-Electron",
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__static, 'preload.js')
        },
        show: !isHiddenOnStartup
    });

    console.log("============ restore window size:", windowWidth, 'x', windowHeight)
    win.setSize(parseInt(windowWidth,10), parseInt(windowHeight,10), false)

    win.loadURL("https://www.deepl.com/translator", {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36'
    });
    win.on('close', function (evt) {
        if (!appQuitting) {
            evt.preventDefault();
            win.hide();
        }
    });

    win.webContents.on('did-finish-load', () => {
      const appConfigPath = path.join(app.getPath('appData'), appName);
      const cssPath = path.join(appConfigPath, 'user_theme.css');
      fs.readFile(cssPath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading CSS file:', err)
          return
        }
        if (data.length == 0) {
          return
        }
        console.log('reading CSS file length:', data.length)
        win.webContents.insertCSS(data)
      })
    })
})

app.on('will-quit', () => {
    globalShortcut.unregister(gShortcut);
});

ipcMain.on('set-hotkey', (event, arg) => {
    console.log("========got new key from :", arg)
    if (!registerShortcut(arg, gShortcut)) {
        event.reply('set-hotkey-reply', false);
        return;
    }

    store.set('short_key', arg);
    event.reply('set-hotkey-reply', true, arg);
})

ipcMain.on('set-window-size', (event, argWidth, argHeight) => {
    console.log("========got new window size :", argWidth, 'x', argHeight)

    store.set('window_width', argWidth);
    store.set('window_height', argHeight);
    event.reply('set-window-size-reply', true, argWidth, argHeight);
    win.setSize(parseInt(argWidth,10),parseInt(argHeight,10),true)
})

function registerShortcut(newShortcut, oldShortcut) {
    let shortcut = globalShortcut.register(newShortcut, () => {
        win.webContents.send('translateClipboard', isRemoveLineBreaks);
        win.show()
    });

    if (!shortcut) {
        messageBox("error", "Register shortcut fail", `You will not be able to use ${newShortcut}`);
        return false;
    }

    if (oldShortcut) {
        globalShortcut.unregister(oldShortcut);
    }
    gShortcut = newShortcut;
    return true;
}

function messageBox(type, title, message) {
    let result = dialog.showMessageBoxSync({
        type: type,
        title: title,
        message: message,
        buttons: ["OK"]
    });
}
