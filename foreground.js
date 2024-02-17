if (window.location.href.includes("twitch.tv")) {

    //#region Chatter Count
    function getLoginFromUrl() {
        const login = window.location.href.split("/")[3];
        if (login) {
            return login;
        }
        return "";
    }

    function postGql(query) {
        return fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
                'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(query)
        }).then(res => res.json())
    }

    function getChatterCount(login) {
        return postGql({
            "operationName": "CommunityTab",
            "variables": {
                "login": login
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "2e71a3399875770c1e5d81a9774d9803129c44cf8f6bad64973aa0d239a88caf"
                }
            }
        }).then(data => {
            if (!data.data.user || !data.data.user.channel) {
                return -1;
            }
            return data.data.user.channel.chatters.count;
        })

    }

    let isFirst = true;

    function createChatterCount(count) {

        if (window.location.href.includes('clips.twitch.tv')) return;
        let query = document.querySelector('p[data-a-target="animated-channel-viewers-count"]');
        if (!query) {
            return;
        }

        let element;

        element = document.getElementById('chatter-count');
        if (!element || isFirst) {
            if (isFirst) isFirst = false;
            element = document.createElement('span');
            element.id = 'chatter-count';
            element.textContent = `  [${count.toLocaleString()}]`;
            element.style.color = '#e84b48';
            element.style.fontSize = '1em';
            element.style.fontWeight = 'bold';
            query.appendChild(element);
            return;
        }
        element.textContent = `  [${count.toLocaleString()}]`;
    }

    function addPercent(viewCount, chatterCount) {
        let query = document.querySelector('p[data-a-target="animated-channel-viewers-count"]');

        let element = document.getElementById('vc-percent');
        const percent = (chatterCount / viewCount * 100).toFixed(2);

        let index = 0;
        if (percent >= 25) index = 1;
        if (percent >= 50) index = 2;
        if (percent >= 65) index = 3;
        if (percent >= 80) index = 4;
        if (percent >= 90) index = 5;
        if (percent >= 100) index = 6;
        let matrix = [
            [150, 0, 0],
            [255, 0, 0],
            [255, 165, 0],
            [255, 255, 0],
            [144, 238, 144],
            [0, 255, 0],
            [100, 216, 230]
        ];

        if (!element) {
            element = document.createElement('span');
            element.id = 'vc-percent';
            element.style.color = `rgb(${matrix[index]})`;
            element.style.fontSize = '1em';
            element.style.fontWeight = 'bold';

            element.textContent = `  ${percent}%`;
            query.appendChild(element);
        }
        element.textContent = `  ${percent}%`;
        element.style.color = `rgb(${matrix[index]})`;
    }

    function getViewCount() {
        if (window.location.href.includes('clips.twitch.tv')) return;
        let query = document.querySelector('p[data-a-target="animated-channel-viewers-count"]');
        if (!query) return -1;
        const child = query.firstChild;
        if (!child) return -1;

        let count = child.textContent;
        count = count.replace(/,/g, '');
        return parseInt(count);
    }

    function checkIfAllExists() {
        return new Promise((resolve, reject) => {
            const login = getLoginFromUrl();
            if (login === "") return resolve(false);
            const chars = /^[0-9a-zA-Z_]+$/;
            if (chars.test(login)) {
                resolve(true);
            } else {
                resolve(false)
            }
        });
    }

    setInterval(async () => {
        return;
        if (window.location.href.includes('clips.twitch.tv')) return;
        if (!window.location.href.includes('https://www.twitch.tv')) return;
        if (window.location.href.includes('https://twitch.tv')) return;
        if (window.location.href.includes('twitch.tv/directory')) return;
        const allThere = await checkIfAllExists();
        if (!allThere) return;

        const login = getLoginFromUrl();
        getChatterCount(login).then(count => {
            if (count === -1) return;
            createChatterCount(count);
            const vc = getViewCount();
            if (vc === -1) return;
            addPercent(vc, count);
        }).catch(err => {
            console.error(err);
        });
    }, 1000);
    //#endregion

    //#region directoy chatter count

    const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const event = new CustomEvent('new-element-added', { detail: mutation.addedNodes });
                document.dispatchEvent(event);
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    document.addEventListener('new-element-added', function (event) {
        const element = event.detail[0];
        if (!element) return;
        if (!element.children || element.children.length === 0) return;
        if (element.children[0].nodeType != Node.ELEMENT_NODE || element.children[0].tagName != 'A') return;

        const login = element.children[0].getAttribute('href').split('/')[1];

        const viewerCount = element.getElementsByClassName('tw-media-card-stat')[0].textContent.split(' ')[0];
        let parsedViewCount = 0;
        if (viewerCount.includes('.')) {
            parsedViewCount = parseInt(viewerCount.split('.')[0]) * 1000 + parseInt(viewerCount.split('.')[1]) * 100;
        } else {
            parsedViewCount = parseInt(viewerCount.replace(/K/g, '000'));
        }

        getChatterCount(login).then(chatter => {
            if (chatter === -1) return;

            const check = document.getElementById("chatter-viewer-percentage_" + login);
            if (check) {
                check.parentNode.removeChild(check);
            }

            const percentageElement = document.createElement('div');
            percentageElement.className = 'Layout-sc-1xcs6mc-0 duHgVC';
            percentageElement.id = "chatter-viewer-percentage_" + login;
            percentageElement.style.right = '0';
            percentageElement.style.marginRight = '.4rem';

            const percent = (chatter / parsedViewCount * 100).toFixed(2);
            let ind = 0;
            if (percent >= 25) ind = 1;
            if (percent >= 50) ind = 2;
            if (percent >= 65) ind = 3;
            if (percent >= 80) ind = 4;
            if (percent >= 90) ind = 5;
            if (percent >= 100) ind = 6;
            let matrix = [
                [150, 0, 0, 0.8],
                [255, 0, 0, 0.8],
                [255, 165, 0, 0.8],
                [255, 255, 0, 0.8],
                [144, 238, 144, 0.8],
                [0, 255, 0, 0.8],
                [100, 216, 230, 0.8]
            ];


            const percentage = document.createElement('div');
            percentage.style.backgroundColor = `rgba(${matrix[ind]})`;
            percentage.className = 'ScMediaCardStatWrapper-sc-anph5i-0 jRUNHm tw-media-card-stat';
            percentage.textContent = `${percent}%`;

            percentageElement.appendChild(percentage);

            const cardWrapper = element.getElementsByClassName('switcher-preview-card__wrapper')[0];
            const actualThingWeWant = cardWrapper.children[0];

            actualThingWeWant.insertBefore(percentageElement, actualThingWeWant.children[2]);

        }).catch(err => {
            console.error(err);
        });
    });
    //#endregion
}
