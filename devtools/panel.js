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

    const gql_reqs = document.getElementsByClassName("gql_request");
    for (let request of gql_reqs) {
        request.children[0].addEventListener("click", function () {
            request.children[1].classList.contains("active") ? request.children[1].classList.remove("active") : request.children[1].classList.add("active");
        });
    }
});
async function getTab() {
    let queryOptions = { active: true, currentWindow: true };
    let tabs = await chrome.tabs.query(queryOptions);
    return tabs[0].url;
}