// A lightweight google chrome tab optimizer by @n0tst3
async function stackTabs() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabsByDomain = groupTabsByDomain(tabs);
    await createTabGroups(tabsByDomain);
}

function groupTabsByDomain(tabs) {
    let tabsByDomain = {};

    tabs.forEach((tab) => {
        if (isValidURL(tab.url)) {
            const url = new URL(tab.url);
            const domain = url.hostname;

            if (tabsByDomain[domain]) {
                tabsByDomain[domain].push(tab.id);
            } else {
                tabsByDomain[domain] = [tab.id];
            }
        }
    });

    return tabsByDomain;
}

async function createTabGroups(tabsByDomain) {
    for (const domain in tabsByDomain) {
        const tabIds = tabsByDomain[domain];

        const groupId = await chrome.tabs.group({ tabIds: tabIds });
        const tabsInGroup = tabIds.length;
        const tabIndices = tabsInGroup > 1 ? [0] : [0, 1];

        await chrome.tabs.highlight({ tabs: tabIndices });
    }
}

async function onTabCreate(tab) {
    if (isValidURL(tab.url)) {
        const existingTab = await findTabWithMatchingDomain(tab);
        if (existingTab) {
            await chrome.tabs.group({ groupId: existingTab.groupId, tabIds: [tab.id] });
            console.log('Tab grouped successfully');
        }
    }
}

async function onTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && isValidURL(tab.url)) {
        const existingTab = await findTabWithMatchingDomain(tab);
        if (existingTab) {
            await chrome.tabs.group({ groupId: existingTab.groupId, tabIds: [tabId] });
            console.log('Tab grouped successfully');
        }
    }
}

async function findTabWithMatchingDomain(tab) {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const domain = new URL(tab.url).hostname;
    return tabs.find((t) => {
        return new URL(t.url).hostname === domain && t.id !== tab.id;
    });
}

function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

function autoSortTabsByDomain(enabled) {
    if (enabled) {
        chrome.tabs.onCreated.addListener(onTabCreate);
        chrome.tabs.onUpdated.addListener(onTabUpdate);
        stackTabs();
    } else {
        chrome.tabs.onCreated.removeListener(onTabCreate);
        chrome.tabs.onUpdated.removeListener(onTabUpdate);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('stack-tabs-btn').addEventListener('click', stackTabs);

    chrome.storage.sync.get('autoSortEnabled', function (data) {
        document.getElementById('auto-sort-checkbox').checked = data.autoSortEnabled;
        autoSortTabsByDomain(data.autoSortEnabled);
    });

    document.getElementById('auto-sort-checkbox').addEventListener('change', function () {
        const enabled = this.checked;
        chrome.storage.sync.set({ 'autoSortEnabled': enabled }, function () {
            autoSortTabsByDomain(enabled);
        });
    });
});
