//this is to restrict the notifications spamming the screen
let activeNotifications = [];

// https://www.youtube.com/watch?v=wZu4q0FyTOk
function showNotification(messageType, message, buttonElement=null, secondsVisible=2) {
    const notificationContainer = document.querySelector(".notification-container");
    
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

    //disable the button temporarily so user can see the warning
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
        activeNotifications = activeNotifications.filter((messageID) => messageID!==thisMessageID);
        notification.remove();
    }, secondsVisible*1000);
}
