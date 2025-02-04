const {
    ipcRenderer
} = require('electron');
const remote = require('@electron/remote');

window.addEventListener('load', (event) => {
    ipcRenderer.on('set-window-size-reply', (event, isOk, argWidth, argHeight) => {
        if (isOk) {
            window.localStorage.setItem('window_width', argWidth);
            window.localStorage.setItem('window_height', argHeight);
            console.log('=============== saved :', argWidth, 'x', 'argHeight');
        }
        var w = remote.getCurrentWindow();
        w.close();
        window.setSize(argWidth, argHeight, true)
    });

    loadWindowsSize();
});

async function loadWindowsSize() {
    let windowWidth = window.localStorage.window_width;
    let windowHeight = window.localStorage.window_height;
    document.getElementById("windowWidth").value = windowWidth;
    document.getElementById("windowHeight").value = windowHeight;
    console.log("========load window size:", windowWidth, 'x', windowHeight);
}

function saveWindowsSize() {
    console.log('=============== start :');
    const windowWidth = document.getElementById("windowWidth").value;
    const windowHeight = document.getElementById("windowHeight").value;
    ipcRenderer.send('set-window-size', windowWidth, windowHeight);
}

function validateMax() {
    if (this.max) this.value = Math.min(parseInt(this.max), parseInt(this.value) || 0);
}

function validateMin() {
    if (this.min) this.value = Math.max(parseInt(this.min), parseInt(this.value) || 0);
}

document.addEventListener('DOMContentLoaded', function() {
    const wsSave = document.getElementById('save');
    wsSave.addEventListener('click', saveWindowsSize);

    const inputWindowWidth = document.getElementById('windowWidth')
    inputWindowWidth.addEventListener('change', validateMax);
    inputWindowWidth.addEventListener('change', validateMin);

    const inputWindowHeight = document.getElementById('windowHeight')
    inputWindowHeight.addEventListener('change', validateMax);
    inputWindowHeight.addEventListener('change', validateMin);
});
