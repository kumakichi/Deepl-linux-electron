let url = '';
let URL = require('url');
let path = require('path');

let gShortcut;

let isRemoveLineBreaks = false;

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

app.setAboutPanelOptions({
    applicationName: 'Deepl-Linux-Electron',
    applicationVersion: app.getVersion(),
    copyright: '© 2021 kumakichi'
})


app.on('ready', function() {
    let Menu = require('electron').Menu;
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
            label: "Remove Line Breaks",
            type: "checkbox",
            checked: false,
            click: (item) => {
                isRemoveLineBreaks = item.checked;
                win.webContents.send('translateClipboard', item.checked);
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
                await shell.openExternal('https://github.com/kumakichi/Deepl-linux')
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
        }
    });

    win.loadURL("https://www.deepl.com/translator", {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36'
    });
    win.on('close', function (evt) {
        if (!appQuitting) {
            evt.preventDefault();
            win.hide();
        }
    });
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
