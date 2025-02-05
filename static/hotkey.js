const {
    ipcRenderer
} = require('electron')
const remote = require('@electron/remote')

window.addEventListener('load', (event) => {
    ipcRenderer.on('set-hotkey-reply', (event, isOk, arg) => {
        if (isOk) {
            window.localStorage.setItem('shortKey', arg);
            console.log('=============== saved :', arg);
        }
        var w = remote.getCurrentWindow();
        console.log("wwww:", w);
        w.close();
    });

    loadHotkey();
});

async function loadHotkey() {
    let shortKey = window.localStorage.shortKey;
    console.log("========load hotkey:", shortKey);
    if (!shortKey) shortKey = 'Control+Alt+C';
    document.getElementById("hotkey").value = shortKey;
}

function saveHotkey() {
    const hotkey = document.getElementById("hotkey").value;
    ipcRenderer.send('set-hotkey', hotkey);
    //console.log(hotkey, "key pressed");
}

function keyUp(event) {
    const keyCode = event.keyCode;
    const key = event.key;
    const charCode = event.code;

    if ((keyCode >= 16 && keyCode <= 18) || keyCode === 91) return;

    const value = [];
    event.ctrlKey ? value.push("Control") : null;
    event.shiftKey ? value.push("Shift") : null;
    event.altKey ? value.push("Alt") : null;
    event.metaKey ? value.push("Meta") : null;
    value.push(key.toUpperCase());

    document.getElementById("hotkey").value = value.join("+");
}

document.addEventListener('DOMContentLoaded', function() {
    const hotkeyInput = document.getElementById('hotkey');
    hotkeyInput.addEventListener('keyup', keyUp);

    const hotkeySave = document.getElementById('save');
    hotkeySave.addEventListener('click', saveHotkey);
});
