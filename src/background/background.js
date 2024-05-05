// Listens to URL/Tab changes and continuously checks for existing reminders to notify popup.js
// remember: background.js does not have directly access to the DOM


// Listen for when a tab is activated or its URL is updated
chrome.tabs.onActivated.addListener(checkActiveTab);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        checkActiveTab();
    }
});

function checkActiveTab() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        // console.log('Active or updated URL:', url);
        // TODO: notify the user with a browser notification if there are reminders
    });
}
