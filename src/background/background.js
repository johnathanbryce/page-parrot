// Listens to URL/Tab changes and continuously checks for existing reminders to notify popup.js
// remember: background.js does not have directly access to the DOM

let notificationShown = false;  // flag to track if the notification has been shown

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateBadge") {
        checkActiveTab();  // Re-check active tab to update the badge count
    }
});

// access the user's active URL
async function getCurrentUrl() {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        let url = tab.url;
        // create a URL object -- this will help target the hostname: www.google.ca instead of www.google.ca/xyz
        const parsedUrl = new URL(url);
        // combine the protocol and hostname to get the base URL
        const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
        return baseUrl;
    } catch (error) {
        console.error('Error fetching current URL:', error);
    }
}

// check the active tab's URL to notify the user of any reminders
async function checkActiveTab() {
    try {
        const baseUrl = await getCurrentUrl();
        if (baseUrl) {
            chrome.storage.sync.get(baseUrl, function(data) {
                if (data[baseUrl] && data[baseUrl].length > 0) {
                    // set badge text to the number of reminders
                    updateBadge(data[baseUrl].length);
                    if (!notificationShown && data[baseUrl].length > 0) {
                        chrome.notifications.create({
                            type: "basic",
                            iconUrl: chrome.runtime.getURL("src/images/page-parrot-transparent.png"),
                            title: "Reminder Alert",
                            message: `You have ${data[baseUrl].length.toString()} reminders for this page!`,
                            priority: 2
                        });
                        notificationShown = true;  // set flag to true after showing notification
                    }
                } else {
                    updateBadge(0); // clear the badge if there are no reminders
                }
            });
        }
    } catch (error) {
        console.error('Failed to fetch or process the URL:', error);
    }
}


// function to update the badge count
function updateBadge(count) {
    if (count > 0) {
        chrome.action.setBadgeText({
            text: count.toString()
        });
        chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
        chrome.action.setBadgeBackgroundColor({ color: '#FF4136' });
    } else {
        // clear the badge if there are no reminders
        chrome.action.setBadgeText({ text: '' });
    }
}

// triggers when the tab is activated
chrome.tabs.onActivated.addListener(() => {
    notificationShown = false;  // reset flag when the tab is activated
    checkActiveTab();
});

// triggers on tab creation
chrome.tabs.onCreated.addListener(() => {
    notificationShown = false;  // reset flag when a new tab is created
    checkActiveTab();
});

// triggers when the tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        notificationShown = false;  // reset flag when the tab is updated with a new URL
        checkActiveTab();
    }
});

// triggers when the extension is installed or reloaded
chrome.runtime.onInstalled.addListener(() => {
    notificationShown = false;  // reset flag on installation or reload
    chrome.storage.sync.set({ notificationShown: false });  // store the initial notification state
    checkActiveTab();  // initial check on extension load
});


checkActiveTab();  // initial check on extension load




