/* This script is  responsible for:
   - Fetching and displaying existing reminders when the popup is opened
   - Adding/deleting reminders to the current active URL and updating the display immediately
*/

/*
// TODO:
    - notifications -- look into "Chrome's notification system" to alert users when they revisit a page with an active reminder
    -- edit existing reminders
*/

// ensures dom loaded before fetching url and displaying reminders 
document.addEventListener('DOMContentLoaded', function() {
    getCurrentUrl().then(displayReminders);
});

document.addEventListener("DOMContentLoaded", function() {
    var input = document.getElementById('reminder-text');
    input.addEventListener("focus", function() {
        this.nextElementSibling.style.visibility = 'visible';  // Show warning label on focus
    });

    input.addEventListener("blur", function() {
        if (this.value === "") {
            this.nextElementSibling.style.visibility = 'hidden';  // Hide warning label if input is empty
        }
    });
});


const submitForm = document.getElementById('reminder-form');
// TODO: allow for enter keyboard press to submits
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
// TODO: only get the first bit of the url anything after "/"" just ignore 
// page parrot should trigger notifs on every page of the website not at the exact url
async function getCurrentUrl() {
    try {
        let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        let url = tab.url
        // create a URL object
        const parsedUrl = new URL(url);
        // combine the protocol and hostname to get the base URL
        const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
        return baseUrl;
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
            const reminderElement = document.createElement("li");
            // create text node for the reminder text to avoid overriding the innerHTML
            const reminderText = document.createTextNode(reminder);
            reminderElement.appendChild(reminderText);

            // container for icons
            const iconContainer = document.createElement('div');
            iconContainer.className = 'icon-container';

            // edit an existing reminder
            const editIcon = document.createElement('img');
            editIcon.src = '../images//edit-icon.svg'; 
            editIcon.className = 'icon';
            editIcon.onclick = () => editReminder(url, reminder);
            iconContainer.appendChild(editIcon);
            // add delete icon to reminder
            const deleteIcon = document.createElement('img');
            deleteIcon.src = '../images//delete-icon.svg'; 
            deleteIcon.className = 'icon';
            deleteIcon.onclick = () => deleteReminder(url, reminder);
            iconContainer.appendChild(deleteIcon);

            // append the icon container to the li
            reminderElement.appendChild(iconContainer);

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
            displayReminders(url); // refresh the list of reminders
        });
    });
}

function editReminder(url, reminderToEdit) {
    console.log(url, reminderToEdit)
}





