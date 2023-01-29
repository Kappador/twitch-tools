chrome.devtools.panels.create("Twitch Tools", "/img/icon.png", '/devtools/panel.html');

var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});

backgroundPageConnection.postMessage({
    tabId: chrome.devtools.inspectedWindow.tabId,
    scriptToInject: "test.js"
});