//this is to restrict the notifications spamming the screen
const activeNotifications = [];

// https://www.youtube.com/watch?v=wZu4q0FyTOk
function showNotification(messageType, message, buttonElement=null, secondsVisible=2) {
    const notificationContainer = document.querySelector(".notification-container");
    
    // if warnings are turned off, do not show the notification
    if (messageType === "warning" && !modalSettings.showWarnings) {
        return;
    }

    const thisMessageID = (messageType+message+buttonElement+secondsVisible).replace(/\s+/g, '');

    if (activeNotifications.includes(thisMessageID)) {
        return;
    }
    else {
        activeNotifications.push(thisMessageID);
    }

    //disable the button temporarily warning may prevent action
    if (buttonElement) {
        buttonElement.disabled = true;
        
        setTimeout(() => {
            buttonElement.disabled = false;
        }, 300);
    }

    const notification = document.createElement("div");

    notification.classList.add("notification", messageType);

    notification.textContent = message;
    notificationContainer.appendChild(notification);

    setTimeout(() => {
        //remove all instances of this message
        const filteredNotifications = activeNotifications.filter((messageID) => messageID !== thisMessageID);

        activeNotifications.length = 0;
        
        filteredNotifications.forEach((activeNotification) => {
            activeNotifications.push(activeNotification);
        });
        //remove the notification from view
        notification.remove();
    }, secondsVisible*1000);
}
