/* 
This script is  responsible for:
   - Fetching and displaying existing reminders when the popup is opened
   - Adding/deleting reminders to the current active URL and updating the display immediately
*/

/*
// TODO:
    - notifications -- look into "Chrome's notification system" to alert users when they revisit a page with an active reminder
*/

document.addEventListener('DOMContentLoaded', function() {
    // ensures dom loaded before fetching url and displaying reminders 
    getCurrentUrl().then(displayReminders);
    // handles showing and hiding of the warning label
    const warningLabel = document.getElementById('reminder-text');
    warningLabel.addEventListener("focus", function() {
        this.nextElementSibling.style.visibility = 'visible';  // show warning label on focus
    });
    warningLabel.addEventListener("blur", function() {
        if (this.value === "") {
            this.nextElementSibling.style.visibility = 'hidden';  // hide warning label if input is empty
        }
    });
});

// displays the error message if reminder submit is invalid 
function handleErrorMessage(isValid, errorMessage = ''){
    const submitErrorMessage = document.getElementById('reminder-length-error-message');
    const textInput = document.getElementById('reminder-text'); 

    if (isValid) {
        textInput.classList.remove('input-error');
        submitErrorMessage.textContent = ''; 
        submitErrorMessage.style.display = 'none'; 
    } else {
        textInput.classList.add('input-error');
        submitErrorMessage.textContent = errorMessage; 
        submitErrorMessage.style.display = 'block'; 
        textInput.focus();
    }
}

const submitForm = document.getElementById('reminder-form');
submitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const textInput = document.getElementById('reminder-text');
    const reminder = textInput.value.trim(); 

    // check the length of the reminder
    if (reminder.length > 30 || reminder.length < 3) {
        handleErrorMessage(false, 'Reminders must be between 3 - 30 characters in length.');
        return; 
    } else {
        handleErrorMessage(true)
        getCurrentUrl().then((url) => {
        addReminder(url, reminder);
        });

        // clear input after getting value
        textInput.value = '';

        const warningLabel = document.getElementById('label-warning');
        if (warningLabel) {
            warningLabel.style.visibility = 'hidden';
        }
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

// date as month - day -year
function getFormattedDate() {
    const date = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);

    // Format the date as MM/DD/YYYY
    return `${month}/${day}/${year}`;
}

// displays reminders to the DOM
function displayReminders(url) {
    chrome.storage.sync.get(url, function(result) {
        const reminders = result[url] || [];
        const remindersListContainer = document.querySelector(".reminders-list");
        remindersListContainer.innerHTML = ''; // clear previous reminders

        // display the reminder(s) (remember, reminder is an obj with text and date keys)
        reminders.forEach(reminderObj => {
            const reminderElement = document.createElement("li");
            reminderElement.className = "reminder-item"
            // set the id of the reminder as its text value
            reminderElement.dataset.id = reminderObj.text; 

            // create text node for the reminder text to avoid overriding the innerHTML
            const reminderText = document.createTextNode(reminderObj.text);
            reminderElement.appendChild(reminderText);

            // date stamp of reminder
            const dateStampContainer = createDateStamp(reminderObj.date);
            reminderElement.appendChild(dateStampContainer);

            // edit an existing reminder
            const editIcon = document.createElement('img');
            editIcon.src = '../images/edit-icon.svg'; 
            editIcon.alt='Edit reminder'
            editIcon.className = 'icon-edit';
            editIcon.onclick = () => editReminder(url, reminderObj.text);
            reminderElement.appendChild(editIcon);
            // add delete icon to reminder
            const deleteIcon = document.createElement('img');
            deleteIcon.src = '../images/delete-icon.svg'; 
            deleteIcon.alt= 'Delete reminder'
            deleteIcon.className = 'icon-delete';
            deleteIcon.onclick = () => deleteReminder(url, reminderObj.text);
            reminderElement.appendChild(deleteIcon);

            remindersListContainer.appendChild(reminderElement);
        });
    });
}

function createDateStamp(dateString) {
    const dateStampContainer = document.createElement("div");
    dateStampContainer.className = "date-stamp";

    if (dateString) {
        const monthSpan = document.createElement("span");
        monthSpan.className = "month";
        monthSpan.textContent = dateString.split('/')[0]; 
        const dayYearSpan = document.createElement("span");
        dayYearSpan.className = "day-year";
        dayYearSpan.textContent = dateString.split('/')[1] + '/' + dateString.split('/')[2]; 

        dateStampContainer.appendChild(monthSpan);
        dateStampContainer.appendChild(dayYearSpan);
    } else {
        dateStampContainer.textContent = "Date missing"; // handle cases where date is missing
    }

    return dateStampContainer;
}

// adds a new reminder to chrome.storage.sync (displayed on DOM via displayReminders)
function addReminder(url, reminderText) {
    chrome.storage.sync.get(url, function(result) {
        let reminders = result[url] || [];
        // ensure we are not storing a reminder that already exists
        if (reminders.some(r => r.text === reminderText)) {
            handleErrorMessage(false, "This reminder already exists!");
            return;
        }

        const reminder = {
            text: reminderText,
            date: getFormattedDate()  
        };

        reminders.push(reminder);
        chrome.storage.sync.set({ [url]: reminders }, function() {
            displayReminders(url); // refresh the list of reminders
        });
    });
}

// resizes the document.body after deleting a reminder
function forceHeightResize(element){
    let disp = element.style.display;
    element.style.display = 'none';
    let trick = element.offsetHeight; // no need to use it, just access
    element.style.display = disp;
}

// delete a reminder
function deleteReminder(url, reminderToDelete) {
    console.log(reminderToDelete)
    exitEditMode()
    // get the reminders to remove the targetted reminder
    chrome.storage.sync.get(url, function(result) {
        // get all reminders for the url as an array
       let reminders = result[url]
        // filter out the targetted reminder from this list
       let filteredReminders = reminders.filter(rem => rem.text !== reminderToDelete)
        // update the storage with the new filtered array
        chrome.storage.sync.set({ [url]: filteredReminders }, function() {
            displayReminders(url); // refresh the list of reminders
        });
    });

    forceHeightResize(document.body);
}

function editReminder(url, reminderToEdit) {
    if(reminderToEdit){
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
}

function saveReminder(url, reminderToSave) {
    console.log(reminderToSave)
    if (reminderToSave) {
        const reminderEle = document.querySelector(`li[data-id="${reminderToSave}"]`);
        const textNode = reminderEle.firstChild; // get the first child to only update the text in the li
        const updatedText = textNode.textContent.trim();

        // ensure that updated reminder is > 3
        if (updatedText.length < 3) {
            reminderEle.classList.add('input-error');
            reminderEle.setAttribute('data-error-message', 'Reminders must be more than 2 characters long.');
            // keep the reminder in the editable state and the save icon visible
            reminderEle.contentEditable = 'true'; 
            const saveIcon = reminderEle.querySelector('.icon-edit');
            if (saveIcon) {
                saveIcon.src = '../images/save-icon.svg';
                saveIcon.alt = 'Save reminder';
                saveIcon.onclick = () => saveReminder(url, reminderToSave); 
            }
        } else {
            // save and revert UI changes 
            reminderEle.classList.remove('input-error');
            reminderEle.removeAttribute('data-error-message');
            reminderEle.contentEditable = 'false';

            // only update the text content, not the entire <li> 
            textNode.textContent = updatedText;

            const editIcon = reminderEle.querySelector('.icon-edit');
            if (editIcon) {
                editIcon.src = '../images/edit-icon.svg';
                editIcon.alt = 'Edit reminder';
                editIcon.onclick = () => editReminder(url, reminderToSave);
            }

            updateReminderInStorage(url, reminderToSave, updatedText);
            exitEditMode();
        }
    }
}


function updateReminderInStorage(url, oldReminder, updatedReminder) {
    chrome.storage.sync.get(url, function(result) {
        let reminders = result[url];
        let reminder = reminders.find(rem => rem.text === oldReminder);
        console.log('in update', reminder)
        if (reminder) {
            reminder.text = updatedReminder; // updated reminder
            reminder.date = getFormattedDate(); // updated date
        }
        chrome.storage.sync.set({ [url]: reminders }, function() {
            displayReminders(url);
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







