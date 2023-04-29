// A lightweight google chrome tab optimizer by @n0tst3
function stackTabs() {
    var tabsByDomain = {};
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            var url = new URL(tab.url);
            var domain = url.hostname;
            if (domain in tabsByDomain) {
                tabsByDomain[domain].push(tab.id);
            } else {
                tabsByDomain[domain] = [tab.id];
            }
        }
        for (var domain in tabsByDomain) {
            var tabIds = tabsByDomain[domain];

            chrome.tabs.group({ tabIds: tabIds }, function (groupId) {
                var tabsInGroup = tabIds.length;
                var tabIndices = tabsInGroup > 1 ? [0] : [0, 1];
                chrome.tabs.highlight({ tabs: tabIndices });
            });
        }
    });
}
function onTabCreate(tab) {
    if (tab.url) {
        chrome.tabs.query({ currentWindow: true }, function (tabs) {
            var existingTab = tabs.find(function (t) {
                var url = new URL(t.url);
                var domain = url.hostname;
                return domain === new URL(tab.url).hostname && t.id !== tab.id;
            });
            if (existingTab) {
                chrome.tabs.group({ groupId: existingTab.groupId, tabIds: [tab.id] }, function () {
                    console.log('Tab grouped successfully');
                });
            }
        });
    }
}
function onTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        chrome.tabs.query({ currentWindow: true }, function (tabs) {
            var existingTab = tabs.find(function (t) {
                var url = new URL(t.url);
                var domain = url.hostname;
                return domain === new URL(tab.url).hostname && t.id !== tab.id;
            });
            if (existingTab) {
                chrome.tabs.group({ groupId: existingTab.groupId, tabIds: [tabId] }, function () {
                    console.log('Tab grouped successfully');
                });
            }
        });
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
        var enabled = this.checked;
        chrome.storage.sync.set({ 'autoSortEnabled': enabled }, function () {
            autoSortTabsByDomain(enabled);
        });
    });
});
