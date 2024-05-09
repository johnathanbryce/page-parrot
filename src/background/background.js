// Listens to URL/Tab changes and continuously checks for existing reminders to notify popup.js
// remember: background.js does not have directly access to the DOM

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateBadge") {
        checkActiveTab(); // refresh the badge count based on the active tab's reminders
    }
});

// access the users active url 
async function getCurrentUrl() {
    try {
        let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        let url = tab.url
        // create a URL object -- this will help target the hostname: www.google.ca instead of www.google.ca/xyz
        const parsedUrl = new URL(url);
        // combine the protocol and hostname to get the base URL
        const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
        return baseUrl;
    } catch (error) {
        console.error('Error fetching current URL:', error);
    }
}

// check the active tabs url to notify user of any reminder(s)
async function checkActiveTab() {
    try {
        const baseUrl = await getCurrentUrl(); 
        if (baseUrl) {
            chrome.storage.sync.get(baseUrl, function(data) {
                if (data[baseUrl] && data[baseUrl].length > 0) {
                    console.log(data[baseUrl] && data[baseUrl].length > 0)
                    // set badge text to the number of reminders
                    chrome.action.setBadgeText({
                        text: data[baseUrl].length.toString()
                    });
                    chrome.action.setBadgeBackgroundColor({color: '#007BFF'}); 
                    chrome.action.setBadgeTextColor({color: '#FFFFFF'}); 

                    // Trigger a notification
                    chrome.notifications.create({
                        type: "basic",
                        iconUrl: "../images/bell-notification.png",
                        title: "Reminder Alert",
                        message: "You have reminders on this page!",
                        priority: 2
                    });
                } else {
                    // clear the badge if there are no reminders
                    chrome.action.setBadgeText({text: ''});
                }
            });
        }
    } catch (error) {
        console.error('Failed to fetch or process the URL:', error);
    }
}


// Event listeners that use the revised checkActiveTab function
chrome.tabs.onActivated.addListener(() => checkActiveTab());
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        checkActiveTab();
    }
});

checkActiveTab()


