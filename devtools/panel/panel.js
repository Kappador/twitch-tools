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

    const query_clear = document.getElementById("gql_clear_query");
    query_clear.addEventListener("click", clearQuery);

    const gql_clear = document.getElementById("gql_clear");
    gql_clear.addEventListener("click", () => {
        gql_requests.clear();
        const requests = document.getElementById("gql_requests");
        requests.innerHTML = "";
    });
});

async function getTab() {
    let queryOptions = { active: true, currentWindow: true };
    let tabs = await chrome.tabs.query(queryOptions);
    return tabs[0].url;
}

function generateHTML(data) {
    const { id, request, response } = data;

    const req = document.createElement("div");
    req.id = "gql_request_" + id;
    req.classList.add("settingspane");
    req.classList.add("gql_request");

    const button = document.createElement("button");
    button.textContent = data.request.body.operationName;
    button.classList.add("testbutton")

    button.addEventListener("click", () => {
        req.children[1].classList.contains("active") ? req.children[1].classList.remove("active") : req.children[1].classList.add("active");
    });

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

    const right = document.createElement("div");
    right.classList.add("right");

    const h4Right = document.createElement("h4");
    h4Right.textContent = "Response Body";
    h4Right.style.marginBottom = "-0.5rem";

    const jsonRight = document.createElement("pre");
    jsonRight.id = "json_right_" + id;
    jsonRight.innerHTML = syntaxHighlight(JSON.stringify(response.body, undefined, 4));

    left.appendChild(h4Left);
    left.appendChild(jsonLeft);

    right.appendChild(h4Right);
    right.appendChild(jsonRight);


    body.appendChild(left);
    body.appendChild(right);

    const deleteOp = document.createElement("input");
    deleteOp.type = "button";
    deleteOp.id = "delete_button_" + id;
    deleteOp.style.backgroundColor = "rgb(90, 0, 200)";
    deleteOp.classList.add("pink-btn");
    deleteOp.value = "Delete";

    deleteOp.addEventListener("click", () => {
        gql_requests.delete(id);
        const requests = document.getElementById("gql_requests");
        const request = document.getElementById("gql_request_" + id);
        requests.removeChild(request);
    });

    const copyOp = document.createElement("input");
    copyOp.type = "button";
    copyOp.id = "copy_button_" + id;
    copyOp.style.backgroundColor = "rgb(90, 0, 200)";
    copyOp.classList.add("pink-btn");
    copyOp.value = "Copy";

    copyOp.addEventListener("click", () => {
        const req = gql_requests.get(id);
        if (!req) return;

        const copy = JSON.stringify(req, undefined, 4);
        navigator.clipboard.writeText(copy);
    });

    content.appendChild(body);
    content.appendChild(deleteOp);
    content.appendChild(copyOp);

    req.appendChild(button);
    req.appendChild(content);

    return req;
}

function clearQuery() {
    const gql_query = document.getElementById("gql_query");
    gql_query.value = "";
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

    const gql_query = document.getElementById("gql_query");
    const query = gql_query.value;
    hideSelected(query);

}, 10);

function hideSelected(select) {
    const gql_requests = document.getElementById("gql_requests");
    const requests = gql_requests.getElementsByClassName("gql_request");

    for (let request of requests) {
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

/**
 * @type {Map<string, { request: any, response: any }>}
 */
const gql_requests = new Map();
const spade_requests = new Map();

const emitter = new EventEmitter();

emitter.on("gql", (data) => {
    const id = uuidv4();
    gql_requests.set(id, data);
    const html = generateHTML({ id, ...data });

    const requests = document.getElementById("gql_requests");
    requests.insertBefore(html, requests.firstChild).focus();

    html.firstChild.classList.add("in");
});

chrome.devtools.network.onRequestFinished.addListener(async request => {
    request.getContent((body) => {
        if (request.request && (request.request.method != "POST" || request.request.url != "https://gql.twitch.tv/gql")) return;

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
    });
});