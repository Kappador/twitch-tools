chrome.devtools.panels.create("Twitch Tools", "/img/icon.png", '/devtools/panel.html');

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        // details.requestBody is a buffer, convert to json object

        const json = details.requestBody ? JSON.parse(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes))) : null;
        if (!json) return;
        console.log(json, details)
    },
    {urls: ["*://*.twitch.tv/*"]},
    ["requestBody", "blocking"]
)
setInterval(() => {console.log("r")}, 1000);

var backgroundPageConnection = chrome.runtime.connect({
    name: "devtools-page"
});

backgroundPageConnection.postMessage({
    tabId: chrome.devtools.inspectedWindow.tabId,
    scriptToInject: "test.js"
});