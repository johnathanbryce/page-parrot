/* 
This script is  responsible for:
   - Fetching and displaying existing reminders when the popup is opened
   - Adding/deleting reminders to the current active URL and updating the display immediately
*/

/*
// TODO:
    - notifications -- look into "Chrome's notification system" to alert users when they revisit a page with an active reminder
    -- edit existing reminders
    -- add a time stamp for when these were last left
*/

// ensures dom loaded before fetching url and displaying reminders 
document.addEventListener('DOMContentLoaded', function() {
    getCurrentUrl().then(displayReminders);
});

document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById('reminder-text');
    input.addEventListener("focus", function() {
        this.nextElementSibling.style.visibility = 'visible';  // show warning label on focus
    });

    input.addEventListener("blur", function() {
        if (this.value === "") {
            this.nextElementSibling.style.visibility = 'hidden';  // hide warning label if input is empty
        }
    });
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

// displays reminders to the DOM
function displayReminders(url) {
    chrome.storage.sync.get(url, function(result) {
        const reminders = result[url] || [];
        const remindersListContainer = document.querySelector(".reminders-list");
        remindersListContainer.innerHTML = ''; // clear previous reminders
        // display the reminder(s) 
        reminders.forEach(reminder => {
            const reminderElement = document.createElement("li");
            reminderElement.className = "reminder-item"
            // set the id of the reminder as its text value
            reminderElement.dataset.id = reminder; 

            // create text node for the reminder text to avoid overriding the innerHTML
            const reminderText = document.createTextNode(reminder);
            reminderElement.appendChild(reminderText);

            // edit an existing reminder
            const editIcon = document.createElement('img');
            editIcon.src = '../images/edit-icon.svg'; 
            editIcon.alt='Edit reminder'
            editIcon.className = 'icon-edit';
            editIcon.onclick = () => editReminder(url, reminder);
            reminderElement.appendChild(editIcon);
            // add delete icon to reminder
            const deleteIcon = document.createElement('img');
            deleteIcon.src = '../images/delete-icon.svg'; 
            deleteIcon.alt= 'Delete reminder'
            deleteIcon.className = 'icon-delete';
            deleteIcon.onclick = () => deleteReminder(url, reminder);
            reminderElement.appendChild(deleteIcon);

            remindersListContainer.appendChild(reminderElement);
        });
    });
}

// adds a new reminder to chrome.storage.sync (displayed on DOM via displayReminders)
function addReminder(url, reminder) {
    // TODO: check if the reminder already exists on the list and do not allow
    // the user to add it if it already exists
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
    exitEditMode()
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

// TODO:
// need to disable all other reminders and set the focus on the editted reminder
// i.e need to focus the remidner being editted and the other inputs CANNOT
// be deleted or editted or functionality gets messed up
function editReminder(url, reminderToEdit) {
    // get the reminder ele and make it edittable
    const reminderEle = document.querySelector(`li[data-id="${reminderToEdit}"]`);
    reminderEle.contentEditable = 'true';
    reminderEle.classList.add('editing') // this identifies the reminder currently being editted

    enterEditMode();

    // replace edit icon with save icon
    const editIcon = reminderEle.querySelector('.icon-edit');
    editIcon.src = '../images/save-icon.svg';
    editIcon.alt = 'Save reminder';
    editIcon.onclick = () => saveReminder(url, reminderToEdit);
}

function saveReminder(url, reminderToEdit) {
    // get the reminder ele and make it unedittable
    const reminderEle = document.querySelector(`li[data-id="${reminderToEdit}"]`);
    reminderEle.contentEditable = 'false';

    // show delete icon and enable "Save Reminder" button
    const deleteIcon = reminderEle.querySelector('.icon-delete');
    deleteIcon.style.visibility = 'visible';

    const submitBtn = document.querySelector('.btn-submit-reminder');
    submitBtn.disabled = false;
    submitBtn.classList.remove("btn-submit-reminder-disabled");

    // replace save icon with edit icon
    const saveIcon = reminderEle.querySelector('.icon-edit');
    saveIcon.src = '../images/edit-icon.svg';
    saveIcon.alt = 'Edit reminder';
    saveIcon.onclick = () => editReminder(url, reminderToEdit);

    // Save the updated reminder text
    const updatedText = reminderEle.textContent;
    updateReminderInStorage(url, reminderToEdit, updatedText);

    // remove disabled class from other reminders
    exitEditMode()
}

function updateReminderInStorage(url, oldReminder, newReminder) {
    chrome.storage.sync.get(url, function(result) {
        let reminders = result[url];
        let reminderIndex = reminders.indexOf(oldReminder);
        reminders[reminderIndex] = newReminder; // update with new reminder text
        chrome.storage.sync.set({ [url]: reminders }, function() {
            displayReminders(url); // refresh the list of reminders
        });
    });
}

// adds disabled class to all reminder(s), input, and button
function enterEditMode() {
    // target all the reminders not currently being editted to apply disabled class
    const remindersList = document.querySelectorAll('.reminder-item')
    remindersList.forEach(reminder => {
        if(!reminder.classList.contains('editing')){
            reminder.classList.add('disabled')
        }
    })
    // apply disabled class to the input
    const reminderInput = document.querySelector('.reminder-input-text');
    reminderInput.classList.add('disabled')

    // apply disabled class to the input
    const saveButton = document.querySelector('.btn-submit-reminder');
    saveButton.classList.add('disabled')

}

// removes all disabled reminders when editted reminder is saved or closed.
function exitEditMode() {
    // remove from reminder(s)
    document.querySelectorAll('.reminder-item.disabled').forEach(reminder => {
        reminder.classList.remove('disabled');
    });
    // remove from input
    const reminderInput = document.querySelector('.reminder-input-text');
    if (reminderInput && reminderInput.classList.contains('disabled')) {
        reminderInput.classList.remove('disabled');
    }
    // remove from button
    const submitButton = document.querySelector('.btn-submit-reminder');
    if (submitButton && submitButton.classList.contains('disabled')) {
        submitButton.classList.remove('disabled');
    }
}







