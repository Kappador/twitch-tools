class EventEmitter {
    constructor() {
        this.callbacks = {}
    }

    on(event, cb) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(cb)
    }

    emit(event, data) {
        let cbs = this.callbacks[event]
        if (cbs) {
            cbs.forEach(cb => cb(data))
        }
    }
}

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.getElementsByClassName("tabbar")[0].children;
    for (let tab of tabs) {
        tab.addEventListener("click", function () {
            for (let tab of tabs) {
                tab.classList.remove("active");
            }
            this.classList.add("active");
            const tabId = this.getAttribute("data-tab");

            const tabContents = document.getElementsByClassName("tabcontent");
            for (let tabContent of tabContents) {
                tabContent.classList.remove("active");
            }

            document.getElementsByClassName("tabcontent")[tabId].classList.add("active");
        });
    }

    const query_clear = document.getElementById("clear_query");
    query_clear.addEventListener("click", clearQuery);

    const clear = document.getElementById("clear");
    clear.addEventListener("click", () => {
        gql_requests.clear()
        const requests = document.getElementById("gql_requests");
        requests.innerHTML = "";
    });

    const clearDupes = document.getElementById("clearDupes");
    clearDupes.addEventListener("click", () => {

        const map = new Map();

        for (let [key, req] of gql_requests) {
            const opName = req.request.body.operationName;
            if (!map.has(opName)) {
                map.set(opName, {
                    id: key,
                    req: req,
                });
            }
        }

        gql_requests.clear();

        const div = document.getElementById("gql_requests");
        div.innerHTML = "";

        for (let [key, req] of map) {
            gql_requests.set(req.id, req.req);
            populateRequests("gql", req.req);
        }
    });

    clear.addEventListener("click", () => {
        gql_requests.clear()
        const requests = document.getElementById("gql_requests");
        requests.innerHTML = "";
    });
});

async function getTab() {
    let queryOptions = { active: true, currentWindow: true };
    let tabs = await chrome.tabs.query(queryOptions);
    return tabs[0].url;
}

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    fallbackCopyTextToClipboard(text);
}

function generateHTML(data) {
    const { id, request, response } = data;

    const req = document.createElement("div");
    req.id = "gql_request_" + id;
    req.classList.add("settingspane");
    req.classList.add("gql_request");

    const button = document.createElement("button");
    button.classList.add("testbutton")
    button.style.width = "100%";

    button.addEventListener("click", () => {
        req.children[1].classList.contains("active") ? req.children[1].classList.remove("active") : req.children[1].classList.add("active");
    });

    const kys = document.createElement("div");
    kys.classList.add("body");

    const opName = document.createElement("p");
    opName.textContent = request.body.operationName;

    const deleteOp = document.createElement("button");
    deleteOp.textContent = "❌";
    deleteOp.classList.add("xout");
    deleteOp.style.marginTop = "-0.1rem";

    deleteOp.addEventListener("click", () => {
        gql_requests.delete(id);

        const requests = document.getElementById("gql_requests");
        const requer = document.getElementById("gql_request_" + id);
        requests.removeChild(requer);
    });

    deleteOp.classList.add("right");

    kys.appendChild(deleteOp);
    kys.appendChild(opName);
    button.appendChild(kys);

    const content = document.createElement("div");
    content.classList.add("content");

    const body = document.createElement("div");
    body.classList.add("body");

    const left = document.createElement("div");
    left.classList.add("left");

    const h4Left = document.createElement("h4");
    h4Left.textContent = "Request Body";
    h4Left.style.marginBottom = "-0.5rem";

    const jsonLeft = document.createElement("pre");
    jsonLeft.id = "json_left_" + id;
    jsonLeft.innerHTML = syntaxHighlight(JSON.stringify(request.body, undefined, 4));

    const copyRequest = document.createElement('input');
    copyRequest.type = "button";
    copyRequest.style.backgroundColor = "rgb(90, 0, 200)";
    copyRequest.classList.add("pink-btn", "copy-code-button");
    copyRequest.value = "Copy";
    copyRequest.addEventListener('click', () => {
        copyTextToClipboard(JSON.stringify(request.body, undefined, 4));
    });

    const copyTypeRequest = document.createElement("input");
    copyTypeRequest.type = "button";
    copyTypeRequest.style.backgroundColor = "rgb(90, 0, 200)";
    copyTypeRequest.classList.add("pink-btn", "copy-code-button");
    copyTypeRequest.value = "Copy Type";
    copyTypeRequest.addEventListener('click', () => {
        const text = convertGqlRequestToJson(request.body);
        console.log(text)
    });

    left.appendChild(h4Left);
    left.appendChild(jsonLeft);
    left.appendChild(copyRequest);
    left.appendChild(copyTypeRequest);

    body.appendChild(left);


    left.style.minWidth = "50%";

    const right = document.createElement("div");
    right.classList.add("right");

    const h4Right = document.createElement("h4");
    h4Right.textContent = "Response Body";
    h4Right.style.marginBottom = "-0.5rem";

    const jsonRight = document.createElement("pre");
    jsonRight.id = "json_right_" + id;
    jsonRight.innerHTML = syntaxHighlight(JSON.stringify(response.body, undefined, 4));


    const copyResponse = document.createElement("input");
    copyResponse.type = "button";
    copyResponse.style.backgroundColor = "rgb(90, 0, 200)";
    copyResponse.classList.add("pink-btn", "copy-code-button");
    copyResponse.value = "Copy";
    copyResponse.addEventListener('click', () => {
        copyTextToClipboard(JSON.stringify(response.body, undefined, 4));
    });

    const copyTypeResponse = document.createElement("input");
    copyTypeResponse.type = "button";
    copyTypeResponse.style.backgroundColor = "rgb(90, 0, 200)";
    copyTypeResponse.classList.add("pink-btn", "copy-code-button");
    copyTypeResponse.value = "Copy Type";
    copyTypeResponse.addEventListener('click', () => {
        const text = convertGqlResponseToJson(response.body);
        console.log(text)
    });


    right.appendChild(h4Right);
    right.appendChild(jsonRight);
    right.appendChild(copyResponse);
    right.appendChild(copyTypeResponse);

    body.appendChild(right);

    content.appendChild(body);

    req.appendChild(button);
    req.appendChild(content);

    return req;
}

function clearQuery() {
    const query = document.getElementById("query");
    query.value = "";
}

function convertGqlRequestToJson(jsonResponse) {

    function determineTypes(obj) {
        let convertedObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertedObj[key] = determineTypes(obj[key]);
                } else {
                    convertedObj[key] = typeof obj[key];
                }
            }
        }
        return convertedObj;
    }

    let convertedVariables = determineTypes(jsonResponse.variables);

    let convertedResponse = {
        operationName: jsonResponse.operationName,
        variables: convertedVariables,
        extensions: jsonResponse.extensions
    };

    let text = JSON.stringify(convertedResponse, undefined, 4);
    text = text.replaceAll("\": \"string\"", "\": string");
    text = text.replaceAll("\": \"number\"", "\": number");
    text = text.replaceAll("\": \"boolean\"", "\": boolean");
    text = text.replaceAll("\": \"object\"", "\": object");
    text = text.replaceAll("\": \"null\"", "\": null");

    text = `export type ${jsonResponse.operationName}Request = ${text};`

    copyTextToClipboard(text);
    return text;
}

function convertGqlResponseToJson(jsonResponse) {

    function determineTypes(obj) {
        let convertedObj = {};
        for (let key in obj) {
            if (key.startsWith("__")) {
                convertedObj[key] = obj[key];
                continue;
            }
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertedObj[key] = determineTypes(obj[key]);
                } else {
                    convertedObj[key] = typeof obj[key];
                }
            }
        }
        return convertedObj;
    }

    let convertedVariables = determineTypes(jsonResponse.data);

    let convertedResponse = {
        data: convertedVariables,
        extensions: jsonResponse.extensions
    };

    let text = JSON.stringify(convertedResponse, undefined, 4);
    text = text.replaceAll("\": \"string\"", "\": string");
    text = text.replaceAll("\": \"number\"", "\": number");
    text = text.replaceAll("\": \"boolean\"", "\": boolean");
    text = text.replaceAll("\": \"object\"", "\": object");
    text = text.replaceAll("\": \"null\"", "\": null");

    text = `export type ${jsonResponse.extensions.operationName}Response = ${text};`

    copyTextToClipboard(text);
    return text;
}

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// hider
setInterval(() => {

    const query = document.getElementById("query");
    hideSelected(query.value);

}, 10);

function hideSelected(select) {
    const gReqs = document.getElementById("gql_requests");
    const gRequests = gReqs.getElementsByClassName("gql_request");

    for (let request of gRequests) {
        const operation = request.getElementsByTagName("button")[0].textContent;

        if (select === "") {
            request.style.display = "block";
        } else if (operation.toLowerCase().includes(select.toLowerCase())) {
            request.style.display = "block";
        } else {
            request.style.display = "none";
        }
    }
}

function populateRequests(data) {
    const requests = document.getElementById("gql_requests");
    const id = uuidv4();

    gql_requests.set(id, data)

    const html = generateHTML({ id, ...data });
    requests.appendChild(html);
    requests.insertBefore(html, requests.firstChild).focus();

    html.firstChild.classList.add("in");
}

/**
 * @type {Map<string, { request: any, response: any }>}
 */
const gql_requests = new Map();

const emitter = new EventEmitter();

emitter.on("gql", (data) => {
    populateRequests(data);
});

chrome.devtools.network.onRequestFinished.addListener(async request => {
    request.getContent((body) => {
        if (request.request && request.request.method != "POST") return;
        if (request.request.url === "https://gql.twitch.tv/gql") {
            const responseBody = JSON.parse(body);
            const requestBody = JSON.parse(request.request.postData.text);

            for (let i = 0; i < requestBody.length; i++) {
                const req = requestBody[i];
                const res = responseBody[i];

                emitter.emit("gql", {
                    request: { body: req },
                    response: { body: res }
                });
            }
        }
    });
});