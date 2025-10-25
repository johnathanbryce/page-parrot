
/* 
This script is responsible for:
   - Fetching and displaying existing reminders when the popup is opened
   - Adding/deleting reminders to the current active URL and updating the display immediately
*/

// ensures dom loaded before fetching url and displaying reminders 
document.addEventListener('DOMContentLoaded', function() {
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
    if (reminder.length > 250 || reminder.length < 3) {
        handleErrorMessage(false, 'Reminders must be between 3 - 250 characters in length');
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

// date as month - day - year
function getFormattedDate() {
    const date = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    // format the date as MM/DD/YYYY
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
            const editIcon = document.createElement('span'); // Using span to contain the SVG
            editIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="icon-edit">
                <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" fill="currentColor"/>
            </svg>`;
            editIcon.className = 'icon-edit';
            editIcon.onclick = () => editReminder(url, reminderObj.text);
            reminderElement.appendChild(editIcon);
            
            // add delete icon to reminder
            const deleteIcon = document.createElement('span'); 
            deleteIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-delete">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>`;
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
        const dateParts = dateString.split('/');
        // Validate that we have all three parts (month/day/year)
        if (dateParts.length === 3 && dateParts[0] && dateParts[1] && dateParts[2]) {
            const monthSpan = document.createElement("span");
            monthSpan.className = "month";
            monthSpan.textContent = dateParts[0];
            const dayYearSpan = document.createElement("span");
            dayYearSpan.className = "day-year";
            dayYearSpan.textContent = dateParts[1] + '/' + dateParts[2];

            dateStampContainer.appendChild(monthSpan);
            dateStampContainer.appendChild(dayYearSpan);
        } else {
            dateStampContainer.textContent = "Date missing";
        }
    } else {
        dateStampContainer.textContent = "Date missing";
    }

    return dateStampContainer;
}

// function to send message to background.js to update the badge count of reminder(s)
function sendMessageToUpdateBadge() {
    chrome.runtime.sendMessage({action: "updateBadge"});
}

// adds a new reminder to chrome.storage.sync (displayed on DOM via displayReminders)
function addReminder(url, reminderText) {
    chrome.storage.sync.get(url, function(result) {
        let reminders = result[url] || [];
        // ensure we are not storing a reminder that already exists
        if (reminders.some(r => r.text === reminderText)) {
            handleErrorMessage(false, "This reminder already exists!");
            // clear the input field
            const textInput = document.getElementById('reminder-text');
            if (textInput) textInput.value = '';
            return;
        }
        // reminder as an obj with the text and the date 
        const reminder = {
            text: reminderText,
            date: getFormattedDate()  
        };
        reminders.push(reminder);
        chrome.storage.sync.set({ [url]: reminders }, function() {
            displayReminders(url); // refresh the list of reminders
            sendMessageToUpdateBadge(); // tell background.js to update the badge
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
       let filteredReminders = reminders.filter(rem => rem.text !== reminderToDelete)
        // update the storage with the new filtered array
        chrome.storage.sync.set({ [url]: filteredReminders }, function() {
            displayReminders(url); // refresh the list of reminders
            sendMessageToUpdateBadge(); // tell background.js to update the badge
        });
    });
}

function editReminder(url, reminderToEdit) {
    if (reminderToEdit) {
        const reminderEle = document.querySelector(`li[data-id="${reminderToEdit}"]`);

        // Remove any existing keypress handler to prevent duplicates
        if (reminderEle.keypressHandler) {
            reminderEle.removeEventListener('keypress', reminderEle.keypressHandler);
        }

        reminderEle.contentEditable = 'true';
        reminderEle.classList.add('editing'); // this identifies the reminder currently being edited

        enterEditMode();

        // Find the existing edit icon and replace it with the save icon
        const iconContainer = reminderEle.querySelector('.icon-edit');
        iconContainer.innerHTML = `
        <svg fill="currentColor" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg" class="icon-save">
            <path d="M5 3C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H8.00383C8.01113 16.8859 8.02893 16.7701 8.05813 16.6533L8.22145 16H6V11.5C6 11.2239 6.22386 11 6.5 11H11.9436L12.9436 10H6.5C5.67157 10 5 10.6716 5 11.5L5 16C4.44772 16 4 15.5523 4 15V5C4 4.44772 4.44772 4 5 4L6 4V6.5C6 7.32843 6.67157 8 7.5 8L11.5 8C12.3284 8 13 7.32843 13 6.5V4L13.3787 4C13.6439 4 13.8983 4.10536 14.0858 4.29289L15.7071 5.91421C15.8946 6.10175 16 6.3561 16 6.62132V8.00304C16.3367 7.98758 16.6757 8.0311 17 8.13362V6.62132C17 6.09089 16.7893 5.58218 16.4142 5.20711L14.7929 3.58579C14.4178 3.21071 13.9091 3 13.3787 3H5Z" />
            <path d="M14.8092 9.54776L9.97975 14.3772C9.69818 14.6588 9.49842 15.0116 9.40184 15.3979L9.02737 16.8958C8.86451 17.5472 9.45456 18.1372 10.106 17.9744L11.6039 17.5999C11.9902 17.5033 12.343 17.3036 12.6246 17.022L17.454 12.1926C18.1843 11.4622 18.1843 10.2781 17.454 9.54776C16.7237 8.81741 15.5395 8.81741 14.8092 9.54776Z" />
        </svg>`;
        iconContainer.className = 'icon-save'; // Update class if needed
        iconContainer.onclick = () => saveReminder(url, reminderToEdit);

        // Create and store the keypress handler so we can remove it later
        reminderEle.keypressHandler = function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                saveReminder(url, reminderToEdit);
            }
        };

        // listen for Enter key to save reminder
        reminderEle.addEventListener('keypress', reminderEle.keypressHandler);
    }
}


function saveReminder(url, reminderToSave) {
    if (reminderToSave) {
        const reminderEle = document.querySelector(`li[data-id="${reminderToSave}"]`);
        const textNode = reminderEle.firstChild; // get the first child to only update the text in the li
        const updatedText = textNode.textContent.trim();

        // remove any existing error message
        const existingError = document.querySelector(`.error-message`);
        if (existingError) {
            existingError.remove();
        }

        // ensure that updated reminder is > 3 and < 250 chars
        if (updatedText.length > 250 || updatedText.length < 3) {
            
            // create and insert error message element
            const errorMessage = document.createElement('div');
            errorMessage.id = `error-message`;
            errorMessage.textContent = 'Reminders must be between 3 - 250 characters.';
            errorMessage.classList.add('error-message');
            reminderEle.parentNode.insertBefore(errorMessage, reminderEle);
            // add input-error to the li itself (shake and)
            reminderEle.classList.add('input-error');
            reminderEle.contentEditable = 'true';
            const saveIcon = reminderEle.querySelector('.icon-edit');
            if (saveIcon) {
                saveIcon.innerHTML = `
                <svg fill="currentColor" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 3C3.89543 3 3 3.89543 3 5V15C3 16.1046 3.89543 17 5 17H8.00383C8.01113 16.8859 8.02893 16.7701 8.05813 16.6533L8.22145 16H6V11.5C6 11.2239 6.22386 11 6.5 11H11.9436L12.9436 10H6.5C5.67157 10 5 10.6716 5 11.5L5 16C4.44772 16 4 15.5523 4 15V5C4 4.44772 4.44772 4 5 4L6 4V6.5C6 7.32843 6.67157 8 7.5 8L11.5 8C12.3284 8 13 7.32843 13 6.5V4L13.3787 4C13.6439 4 13.8983 4.10536 14.0858 4.29289L15.7071 5.91421C15.8946 6.10175 16 6.3561 16 6.62132V8.00304C16.3367 7.98758 16.6757 8.0311 17 8.13362V6.62132C17 6.09089 16.7893 5.58218 16.4142 5.20711L14.7929 3.58579C14.4178 3.21071 13.9091 3 13.3787 3H5Z" fill="#212121"/>
                    <path d="M14.8092 9.54776L9.97975 14.3772C9.69818 14.6588 9.49842 15.0116 9.40184 15.3979L9.02737 16.8958C8.86451 17.5472 9.45456 18.1372 10.106 17.9744L11.6039 17.5999C11.9902 17.5033 12.343 17.3036 12.6246 17.022L17.454 12.1926C18.1843 11.4622 18.1843 10.2781 17.454 9.54776C16.7237 8.81741 15.5395 8.81741 14.8092 9.54776Z" fill="#212121"/>
                </svg>`;
                saveIcon.alt = 'Save reminder';
                saveIcon.onclick = () => saveReminder(url, reminderToSave); 
            }
        } else {
            // save and revert UI changes
            reminderEle.classList.remove('input-error');
            reminderEle.removeAttribute('data-error-message');
            reminderEle.contentEditable = 'false';

            // Remove the keypress event listener
            if (reminderEle.keypressHandler) {
                reminderEle.removeEventListener('keypress', reminderEle.keypressHandler);
                delete reminderEle.keypressHandler;
            }

            // only update the text content, not the entire <li>
            textNode.textContent = updatedText;

            const editIcon = reminderEle.querySelector('.icon-edit');
            if (editIcon) {
                editIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z" />
                </svg>`;
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
        if (!reminder.classList.contains('editing')) {
            reminder.classList.add('disabled');
        } else {
            // only hide the date-stamp of the reminder being edited
            const dateStamp = reminder.querySelector('.date-stamp');
            if (dateStamp) {
                dateStamp.style.visibility = 'hidden';
            }
        }
    });
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

    // unhide date stamp for the reminder that was being edited
    const editingReminder = document.querySelector('.reminder-item.editing');
    if (editingReminder) {
        const dateStamp = editingReminder.querySelector('.date-stamp');
        if (dateStamp) {
            dateStamp.style.visibility = 'visible';
        }

        // Remove any lingering keypress handler
        if (editingReminder.keypressHandler) {
            editingReminder.removeEventListener('keypress', editingReminder.keypressHandler);
            delete editingReminder.keypressHandler;
        }

        editingReminder.classList.remove('editing');
    }
} 

// remove all reminders for a website
function removeAllRemindersForUrl(baseUrl) {
    chrome.storage.sync.get(baseUrl, function(result) {
        if (result[baseUrl]) {
            chrome.storage.sync.remove(baseUrl, function() {
                displayReminders(baseUrl); 
                sendMessageToUpdateBadge(); 
            });
        } else {
            console.log(`No reminders found for ${baseUrl} to remove.`);
        }
    });
}

// initialize on page load - badge will update when displayReminders is called 






