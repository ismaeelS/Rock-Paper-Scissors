//this is to restrict the notifications spamming the screen
const activeNotifications = [];

const notificationContainer = document.querySelector(".notification-container");
        
// https://www.youtube.com/watch?v=wZu4q0FyTOk
function showNotification(messageType, message, buttonElement=null, secondsVisible=2) {
    // if warnings are turned off, do not show the notification
    if (messageType === "warning" && !settings.showWarnings) {
        return;
    }

    const thisMessageID = (messageType+message+buttonElement+secondsVisible).replace(/\s+/g, '');

    if (activeNotifications.includes(thisMessageID)) {
        return;
    }
    else {
        activeNotifications.push(thisMessageID);
    }

    //disable the button temporarily so user can see the the warning
    if (buttonElement) {
        buttonElement.disabled = true;
        
        setTimeout(() => {
            buttonElement.disabled = false;
        }, 500);
    }

    const notification = document.createElement("div");

    notification.classList.add("notification", messageType);

    notification.textContent = message;
    notificationContainer.appendChild(notification);

    setTimeout(() => {
        const messageIndex = activeNotifications.indexOf(thisMessageID);
        if (messageIndex > -1) activeNotifications.splice(thisMessageID, 1);
        notification.remove();
    }, secondsVisible*1000);
}
