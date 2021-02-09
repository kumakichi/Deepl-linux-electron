const {
    clipboard,
    ipcRenderer
} = require('electron');

const inputValue = (dom, st) => {
    var evt = new InputEvent('input', {
        inputType: 'insertText',
        data: st,
        dataTransfer: null,
        isComposing: false
    });
    dom.value = st;
    dom.dispatchEvent(evt);
}

ipcRenderer.on('translateClipboard', function() {
    inputValue(document.querySelector('.lmt__source_textarea'), clipboard.readText());
});

window.addEventListener('load', (event) => {
    document.title = "Deepl-Linux-Electron";
});
