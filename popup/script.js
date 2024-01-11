async function getCookies(site) {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({ domain: site }, (cookies) => {
            if (cookies.length > 0) {
                resolve(cookies);
            } else {
                reject("No cookies found");
            }
        });
    });
}

async function deleteCookie(cookie) {
    return new Promise((resolve, reject) => {
        let url =
            "http" +
            (cookie.secure ? "s" : "") +
            "://" +
            (cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain) +
            cookie.path;
        chrome.cookies.remove({ name: cookie.name, url: url }, (cookie) => {
            console.log(chrome.runtime.error)
            if (!cookie && chrome.runtime.error) {
                console.log(chrome.runtime.error);
                resolve(false);
            }
            resolve(cookie);
        });
    });
}

async function setCookie(cookie) {
    const epoch = new Date().getTime() / 1000;
    let url =
        "http" +
        (cookie.secure ? "s" : "") +
        "://" +
        (cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain) +
        cookie.path;

    if (epoch > cookie.expirationDate) {
        return;
    }

    if (cookie.hostOnly) {
        delete cookie.domain;
    }
    if (cookie.session == true) {
        delete cookie.expirationDate;
    }

    // .set doesn't accepts these
    delete cookie.hostOnly;
    delete cookie.session;
    cookie.url = url;
    let c = await new Promise((resolve, reject) => {
        chrome.cookies.set(cookie, resolve);
    });

    if (c == null) {
        console.error("Error while restoring the cookie for the URL " + cookie.url);
        return 0;
    } else {
        return 1;
    }
}

async function setCookies(cookies) {
    let count = 0;
    for (let cookie of cookies) {
        count += await setCookie(cookie);
    }
    return count;
}

function getCookieObject(name, value) {
    return {
        domain: ".twitch.tv",
        expirationDate: 1755440604,
        hostOnly: false,
        httpOnly: false,
        name: name,
        path: "/",
        sameSite: "no_restriction",
        secure: true,
        session: false,
        storeId: "0",
        value: value,
    }
}

async function postDataToGQL(data = {}, oauth = null) {
    return new Promise(resolve => {
        try {
            fetch("https://gql.twitch.tv/gql", {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Client-ID': "kimne78kx3ncx6brgo4mv6wki5h1ko",
                    "Authorization": oauth ? "OAuth " + oauth : null
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(data)
            }).then(response => response.json()).then(data => {
                if (data.status == 401) resolve(false);
                resolve(data);
            }).catch(error => { resolve(false); });
        } catch (e) {
            resolve(false);
        }
    })
}

function wait(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function performTokenSwitch(token) {
    const info = await performInfoLookup(token);
    let cookies = await getCookies("twitch.tv");

    var interestingCookies = [];
    cookies.forEach((cookie) => {
        switch (cookie.name) {
            case "auth-token":
                interestingCookies.push(cookie);
                break;
            case "twilight-user":
                interestingCookies.push(cookie);
                break;
            case "login":
                interestingCookies.push(cookie);
                break;
            case "name":
                interestingCookies.push(cookie);
                break;
            case "persistent":
                interestingCookies.push(cookie);
                break;
            case "spare_key":
                interestingCookies.push(cookie);
                break;
            case "bits_sudo":
                interestingCookies.push(cookie);
                break;
            default:
                break;
        }
    });

    if (interestingCookies.length < 7) {
        var randomString =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        interestingCookies = [
            {
                domain: ".twitch.tv",
                expirationDate: 1755440604,
                hostOnly: false,
                httpOnly: true,
                name: "spare_key",
                path: "/",
                sameSite: "unspecified",
                secure: true,
                session: true,
                storeId: "0",
                value: "",
            },
            {
                domain: ".twitch.tv",
                expirationDate: 1755440604,
                hostOnly: false,
                httpOnly: true,
                name: "bits_sudo",
                path: "/",
                sameSite: "unspecified",
                secure: true,
                session: false,
                storeId: "0",
                value: "",
            },
            {
                domain: ".twitch.tv",
                expirationDate: 1755440604,
                hostOnly: false,
                httpOnly: true,
                name: "persistent",
                path: "/",
                sameSite: "unspecified",
                secure: true,
                session: false,
                storeId: "0",
                value: "0::" + randomString,
            },
            {
                domain: ".twitch.tv",
                expirationDate: 1755440604,
                hostOnly: false,
                httpOnly: false,
                name: "login",
                path: "/",
                sameSite: "no_restriction",
                secure: true,
                session: false,
                storeId: "0",
                value: "",
            },
            {
                domain: ".twitch.tv",
                expirationDate: 1755440604,
                hostOnly: false,
                httpOnly: false,
                name: "name",
                path: "/",
                sameSite: "unspecified",
                secure: false,
                session: false,
                storeId: "0",
                value: "",
            },
            {
                domain: ".twitch.tv",
                expirationDate: 1755440604,
                hostOnly: false,
                httpOnly: false,
                name: "twilight-user",
                path: "/",
                sameSite: "no_restriction",
                secure: true,
                session: false,
                storeId: "0",
                value:
                    "{%22authToken%22:%22ax9hzuja828h9ihqojnq2joni005ic%22%2C%22displayName%22:%22yufakung%22%2C%22id%22:%22632492700%22%2C%22login%22:%22yufakung%22%2C%22roles%22:{%22isStaff%22:false}%2C%22version%22:2}",
            },
            {
                domain: ".twitch.tv",
                expirationDate: 1755440604,
                hostOnly: false,
                httpOnly: false,
                name: "auth-token",
                path: "/",
                sameSite: "no_restriction",
                secure: true,
                session: false,
                storeId: "0",
                value: "",
            },
        ];
    }

    // add all interestingCookies to
    cookies = cookies.concat(interestingCookies);

    // change that real quick lmfao
    cookies.forEach((cookie) => {
        switch (cookie.name) {
            case "auth-token":
                cookie.value = token;
                break;
            case "login":
                cookie.value = info.login;
                break;
            case "name":
                cookie.value = info.displayName;
                break;
            case "persistent":
                let persistent = decodeURIComponent(
                    cookies.find((c) => c.name == "persistent").value
                ).split("::");
                persistent[0] = info.id;
                cookie.value = persistent.join("::");
                break;
            default:
                break;
        }
    });

    // now to the annoying part...
    let twilightUserCookie = JSON.parse(
        decodeURIComponent(
            interestingCookies.find((c) => c.name == "twilight-user").value
        )
    );

    twilightUserCookie.displayName = info.displayName;
    twilightUserCookie.login = info.login;
    twilightUserCookie.authToken = token;
    twilightUserCookie.id = info.id;

    twilightUserCookie = encodeURIComponent(
        JSON.stringify(twilightUserCookie)
    )
        .replace(/%7B/g, "{")
        .replace(/%7D/g, "}")
        .replace(/%3A/g, ":");

    cookies.find((c) => c.name == "twilight-user").value =
        twilightUserCookie;

    setCookies(cookies);
    setTimeout(() => {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
            }
        );
    }, 1000);
}

async function performInfoLookup(info) {
    info = info.replace(/[^a-zA-Z0-9_]/g, "");
    let type = await checkTypeOfValue(info);
    if (type.type == "invalid") return "invalid";
    let name = type.username;
    let information = await getInformationFromName(name);
    if (information == "invalid") return "invalid";

    return information;
}

async function getInformationFromName(value) {
    let information = await postDataToGQL([
        {
            "operationName": "ChannelShell",
            "variables": {
                "login": value
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "580ab410bcd0c1ad194224957ae2241e5d252b2c5173d8e0cce9d32d5bb14efe"
                }
            }
        },
        {
            "operationName": "ChannelAvatar",
            "variables": {
                "channelLogin": value
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "84ed918aaa9aaf930e58ac81733f552abeef8ac26c0117746865428a7e5c8ab0"
                }
            }
        },
        {
            "operationName": "PollsEnabled",
            "variables": {
                "login": value
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "1900de8facb83d18c02677c0625e0299c4277b551868d1c9afb998542d57c121"
                }
            }
        },
        {
            "operationName": "ViewerCard",
            "variables": {
                "channelLogin": "kappadoriusthefirst",
                "hasChannelID": false,
                "giftRecipientLogin": value,
                "isViewerBadgeCollectionEnabled": false,
                "withStandardGifting": false
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "823772cac91efa0a24f86a80463f37f0377cb216d7ce57a4ab90b61d1e01de8b"
                }
            }
        }
    ]);

    if (information && information[0].data && information[0].data.userOrError && information[0].data.userOrError.__typename == "User" &&
        information[1].data && information[1].data.user && information[1].data.user.__typename == "User" &&
        information[2].data && information[2].data.channel && information[2].data.channel.__typename == "User" &&
        information[3].data && information[3].data.targetUser && information[3].data.targetUser.__typename == "User") {

        let badges = [];
        if (information[3].data.targetUser.displayBadges) {
            for (let badge of information[3].data.targetUser.displayBadges) {
                badges.push({
                    title: badge.title,
                    description: badge.description,
                    image: badge.image4x
                });
            }
        }

        return {
            id: information[0].data.userOrError.id,
            login: information[0].data.userOrError.login,
            displayName: information[0].data.userOrError.displayName,
            hex: "#" + (information[0].data.userOrError.primaryColorHex ?? "9147ff"),
            pfp: information[0].data.userOrError.profileImageURL,
            banner: information[0].data.userOrError.bannerImageURL ?? "https://static.twitchcdn.net/assets/bg_glitch_pattern-47a314b8795e4a70661d.png",
            live: information[0].data.userOrError.stream ? true : false,
            followers: information[1].data.user.followers.totalCount,
            partner: information[2].data.channel.roles.isPartner,
            affiliate: information[2].data.channel.roles.isAffiliate,
            createdAt: information[3].data.targetUser.createdAt,
            badges: badges
        };
    }

    return "invalid";
}

async function getNameThroughToken(token) {
    let information = await postDataToGQL([
        {
            "operationName": "Settings_ProfilePage_AccountInfoSettings",
            "variables": {},
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "60a54ebcbd29e095db489ed6268f33d5fe5ed1d4fa3176668d8091587ae81779"
                }
            }
        }
    ], token);

    if (!information[0].data.currentUser) return "invalid";

    return information[0].data.currentUser.login;
}

async function checkTypeOfValue(value) {
    let username = await postDataToGQL([
        {
            "operationName": "ChannelShell",
            "variables": {
                "login": value
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "580ab410bcd0c1ad194224957ae2241e5d252b2c5173d8e0cce9d32d5bb14efe"
                }
            }
        }
    ]);

    if (username && username[0].data && username[0].data.userOrError && username[0].data.userOrError.__typename == "User") {
        return { type: "username", username: username[0].data.userOrError.login };
    }

    let id = await postDataToGQL([
        {
            "operationName": "UserModStatus",
            "variables": {
                "channelID": value,
                "userID": value
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "511b58faf547070bc95b7d32e7b5cdedf8c289a3aeabfc3c5d3ece2de01ae06f"
                }
            }
        }
    ]);

    if (id && id[0].data && id[0].data.user && id[0].data.user.__typename == "User") {
        return { type: "id", username: id[0].data.user.login };
    }

    let token = await postDataToGQL([
        {
            "operationName": "Settings_ProfilePage_AccountInfoSettings",
            "variables": {},
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "60a54ebcbd29e095db489ed6268f33d5fe5ed1d4fa3176668d8091587ae81779"
                }
            }
        }
    ], value);

    if (token && token[0].data && token[0].data.currentUser && token[0].data.currentUser.__typename == "User") {
        return { type: "token", username: token[0].data.currentUser.login };
    }

    return "invalid";

}

async function copyTokenToClipboard() {
    const cookies = await getCookies("twitch.tv");
    const token = cookies.filter(cookie => cookie.name === "auth-token")[0].value ?? "no token found";
    navigator.clipboard.writeText(token);
}

function updateUserProfileCard(data) {

    let pfp = document.getElementById("lookup_pfp");
    let banner = document.getElementById("lookup_panel");
    let name_obj = document.getElementById("lookup_name");
    let creation_date = document.getElementById("lookup_creationdate");
    let followers = document.getElementById("lookup_followers");
    let badger = document.getElementById("badger");
    let live = document.getElementById("lookup_live");
    let color = document.getElementById("color_user");
    let id = document.getElementById("id_user");

    banner.style.backgroundImage = "url(" + data.banner + ")";
    pfp.src = data.pfp;
    name_obj.innerHTML = data.displayName;
    name_obj.href = "https://twitch.tv/" + data.login;
    creation_date.innerHTML = "Created on " + new Date(data.createdAt).toLocaleDateString();
    color.style.borderTop = "1px solid " + data.hex;
    id.innerHTML = data.id;

    // format followers
    let followers_str = data.followers.toString();
    let followers_formatted = Intl.NumberFormat('en', { notation: 'compact' }).format(followers_str);


    followers.innerHTML = "Has " + followers_formatted + " followers";


    if (data.partner || data.affiliate) {
        badger.hidden = false;
        badger.src = data.partner ? "../img/partner.png" : "../img/affiliate.png";
    } else {
        badger.hidden = true;
    }

    if (data.live) {
        live.hidden = false;
    } else
        live.hidden = true;


}

async function updateCurrentUser() {
    const cookies = await getCookies("twitch.tv");
    const token = cookies.filter(cookie => cookie.name === "auth-token")[0].value ?? "no token found";
    const name = await getNameThroughToken(token);
    
    if (name === "invalid") return;
    const data = await getInformationFromName(name);
    
    let pfp = document.getElementById("c_lookup_pfp");
    let banner = document.getElementById("c_lookup_panel");
    let name_obj = document.getElementById("c_lookup_name");
    let creation_date = document.getElementById("c_lookup_creationdate");
    let followers = document.getElementById("c_lookup_followers");
    let badger = document.getElementById("c_badger");
    let live = document.getElementById("c_lookup_live");
    let color = document.getElementById("c_color_user");
    let id = document.getElementById("c_id_user");

    banner.style.backgroundImage = "url(" + data.banner + ")";
    pfp.src = data.pfp;
    name_obj.innerHTML = data.displayName;
    name_obj.href = "https://twitch.tv/" + data.login;
    creation_date.innerHTML = "Created on " + new Date(data.createdAt).toLocaleDateString();
    color.style.borderTop = "1px solid " + data.hex;
    id.innerHTML = data.id;

    // format followers
    let followers_str = data.followers.toString();
    let followers_formatted = Intl.NumberFormat('en', { notation: 'compact' }).format(followers_str);


    followers.innerHTML = "Has " + followers_formatted + " followers";


    if (data.partner || data.affiliate) {
        badger.hidden = false;
        badger.src = data.partner ? "../img/partner.png" : "../img/affiliate.png";
    } else {
        badger.hidden = true;
    }

    if (data.live) {
        live.hidden = false;
    } else
        live.hidden = true;


}


document.addEventListener("DOMContentLoaded", function () {
    const github = document.getElementById("github");
    github.addEventListener("click", function () {
        window.open("https://github.com/Kappador", '_blank').focus();
    });

    const logout = document.getElementById("logout");
    logout.addEventListener("click", async function () {
        let twitch_cookies = await getCookies("twitch.tv");
        for (let cookie of twitch_cookies) {
            await deleteCookie(cookie);
            console.log("Deleted cookie: " + cookie.name);
        }

    });

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
            if (this.getAttribute("data-tab") == 2) {
                updateCurrentUser();
            }
        });
    }

    const settings = document.getElementsByClassName("settingspane");
    for (let setting of settings) {
        setting.children[0].addEventListener("click", function () {
            setting.children[1].classList.contains("active") ? setting.children[1].classList.remove("active") : setting.children[1].classList.add("active");
        });
    }

    const inputs = document.getElementsByClassName("settings_input");
    for (let input of inputs) {
        input.addEventListener("change", async function () {
            const setting = this.getAttribute("data-target");
            let oldValue = await localStorage.getItem(setting);
            oldValue = oldValue == "true" ? true : false;
            await localStorage.setItem(setting, !oldValue);
            return;

        });
    }

    const lookup_info = document.getElementById("lookup_info");
    const lookup = document.getElementById("lookup");
    lookup_info.addEventListener("click", async function () {
        let result = await performInfoLookup(lookup.value);
        updateUserProfileCard(result);

        chrome.storage.sync.set({ "last_user": result });
    });

    const lookup_current = document.getElementById("lookup_current");
    lookup_current.addEventListener("click", async function () {
        let result = await performInfoLookup(await extractUsername((await getTab())));
        updateUserProfileCard(result);

        chrome.storage.sync.set({ "last_user": result });
    });

    const lookup_refresh = document.getElementById("lookup_refresh");
    lookup_refresh.addEventListener("click", async function () {
        chrome.storage.sync.get("last_user", async function (items) {
            let result = await performInfoLookup(items.last_user.login);
            updateUserProfileCard(result);
        });
    });

    const login = document.getElementById("login");
    const new_token = document.getElementById("new_token");
    login.addEventListener("click", function () {
        performTokenSwitch(new_token.value);
        new_token.value = "";
    });

    const copy_token = document.getElementById("copy_token");
    copy_token.addEventListener("click", function () {
        copyTokenToClipboard();
    });

});

async function getTab() {
    let queryOptions = { active: true, currentWindow: true };
    let tabs = await chrome.tabs.query(queryOptions);
    return tabs[0].url;
}

async function extractUsername(url) {
    let regex = /https:\/\/www.twitch.tv\/([a-zA-Z0-9_]+)/;
    let match = url.match(regex);
    return match[1];
}

document.body.onload = function () {
    chrome.storage.sync.get("last_user", async function (items) {
        if (!chrome.runtime.error && items.last_user) {
            console.log(items.last_user);
            let result = await performInfoLookup(items.last_user.login);
            updateUserProfileCard(result);
        }

        if (!items.last_user) {
            let result = await performInfoLookup("kappadoriusthefirst");
            updateUserProfileCard(result);
        }
    });
}
