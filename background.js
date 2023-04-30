// background listener
chrome.storage.sync.get("autoSortEnabled", function (data) {
    if (data.autoSortEnabled) {
        chrome.tabs.onCreated.addListener(onTabCreate);
        chrome.tabs.onUpdated.addListener(onTabUpdate);
    }
});
chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === "sync" && changes.autoSortEnabled) {
        if (changes.autoSortEnabled.newValue) {
            chrome.tabs.onCreated.addListener(onTabCreate);
            chrome.tabs.onUpdated.addListener(onTabUpdate);
        } else {
            chrome.tabs.onCreated.removeListener(onTabCreate);
            chrome.tabs.onUpdated.removeListener(onTabUpdate);
        }
    }
});
async function onTabCreate(tab) {
    if (isValidURL(tab.url)) {
        const existingTab = await findTabWithMatchingDomain(tab);
        if (existingTab) {
            if (existingTab.groupId >= 0) {
                await chrome.tabs.group({ groupId: existingTab.groupId, tabIds: [tab.id] });
            } else {
                await chrome.tabs.group({ tabIds: [existingTab.id, tab.id] });
            }
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
