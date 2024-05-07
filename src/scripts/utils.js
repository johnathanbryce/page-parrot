// date as month - day -year
export function getFormattedDate() {
    console.log('running')
    const date = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);

    // Format the date as MM/DD/YYYY
    return `${month}/${day}/${year}`;
}

// access the users active url 
export async function getCurrentUrl() {
    console.log('running')
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