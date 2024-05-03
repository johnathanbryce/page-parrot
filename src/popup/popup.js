/* This script is  responsible for:
   - Fetching and displaying existing reminders when the popup is opened
   - Adding/deleting reminders to the current active URL and updating the display immediately
*/

/*
// TODO:
    - notifications -- look into "Chrome's notification system" to alert users when they revisit a page with an active reminder
*/

// ensures dom loaded before fetching url and displaying reminders 
document.addEventListener('DOMContentLoaded', function() {
    getCurrentUrl().then(displayReminders);
});

const submitForm = document.getElementById('reminder-form');
submitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const textInput = document.getElementById('reminder-text');
    const reminder = textInput.value;
    textInput.value = '';  // Clear input after getting value
    // call the async function to get the url and then execute addReminder
    getCurrentUrl().then((url) => {
        addReminder(url, reminder);
    });
});

// access the users active url 
async function getCurrentUrl() {
    try {
        let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        return tab.url;
    } catch (error) {
        console.error('Error fetching current URL:', error);
    }
}

// displays reminders to the DOM
function displayReminders(url) {
    chrome.storage.sync.get(url, function(result) {
        const reminders = result[url] || [];
        const remindersListContainer = document.querySelector(".reminders-list");
        remindersListContainer.innerHTML = ''; // Clear previous reminders
        // display this list of reminders
        reminders.forEach(reminder => {
            // create an <li> node for this reminder
            const reminderElement = document.createElement("li");

            // create text node for the reminder text to avoid overriding the innerHTML
            const reminderText = document.createTextNode(reminder);
            reminderElement.appendChild(reminderText);

            // add delete icon to reminder
            const deleteIcon = document.createElement('img');
            deleteIcon.src = '../images//delete-icon.svg'; 
            deleteIcon.className = 'icon';
            deleteIcon.onclick = () => deleteReminder(url, reminder);
            reminderElement.appendChild(deleteIcon);

            // Append the reminder li to the ul
            remindersListContainer.appendChild(reminderElement);
        });
    });
}

// adds a new reminder to chrome.storage.sync (displayed on DOM via displayReminders)
function addReminder(url, reminder) {
    chrome.storage.sync.get(url, function(result) {
        let reminders = result[url] || [];
        reminders.push(reminder);
        chrome.storage.sync.set({ [url]: reminders }, function() {
            console.log("Reminders updated for:", url);
            displayReminders(url); // Refresh the list of reminders
        });
    });
}

// delete a reminder
function deleteReminder(url, reminderToDelete) {
    // get the reminders to remove the targetted reminder
    chrome.storage.sync.get(url, function(result) {
        // get all reminders for the url as an array
       let reminders = result[url]
        // filter out the targetted reminder from this list
       let filteredReminders = reminders.filter(rem => rem !== reminderToDelete)
        // update the storage with the new filtered array
        chrome.storage.sync.set({ [url]: filteredReminders }, function() {
            console.log("Reminder deleted:", reminderToDelete);
            displayReminders(url); // refresh the list of reminders
        });
    });
}



