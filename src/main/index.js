let url = '';
let URL = require('url');
let path = require('path');

let gShortcut;

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
    shell
} = require('electron');
var win = null;

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
    win.on('closed', function() {
        win = null
    });
})

app.on('will-quit', () => {
    globalShortcut.unregister(gShortcut);
});

app.on('window-all-closed', function() {
    app.quit();
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
        win.webContents.send('translateClipboard');
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
