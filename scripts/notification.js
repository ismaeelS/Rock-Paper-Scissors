let modalSettings;

export function initNotifications(modalSettingsRef) {
    modalSettings = modalSettingsRef;
}

//this is to restrict the notifications spamming the screen
const activeNotifications = {};

// https://www.youtube.com/watch?v=wZu4q0FyTOk
export function showNotification(messageType, message, buttonElement=null, secondsVisible=3) {
    // if warnings are turned off, do not show the notification
    if (messageType === "warning" && !modalSettings.showWarnings) {
        return;
    }

    //if the user is spamming notifications, warn them
    if (Object.keys(activeNotifications).length > 3) {
        messageType = "warning";
        message = "Okay, relax buddy";
        buttonElement = null;
        secondsVisible = 3;
    }

    //disable the button temporarily to prevent action before seeing the notification
    //ideally would have a confirmation after the click
    if (buttonElement) {
        buttonElement.disabled = true;

        setTimeout(() => {
            buttonElement.disabled = false;
        }, 250);
    }

    const messageSuffix = (messageType.toUpperCase()+message+secondsVisible).replace(/[^a-zA-Z0-9]/g, '');
    const thisMessageID = (buttonElement) ? (buttonElement.textContent.replace(/[^a-zA-Z0-9]/g, '') + messageSuffix) : messageSuffix;

    //create the notification and display it
    const notificationContainer = document.querySelector(".notification-container");
    const notification = document.createElement("div");
    notification.classList.add("notification", messageType);
    notification.textContent = message;
    notificationContainer.appendChild(notification);

    //if an instance of this message is already visible, prematurely time it out and remove it
    if (Object.keys(activeNotifications).includes(thisMessageID)) {
        activeNotifications[thisMessageID]["button"].remove();
        clearTimeout(activeNotifications[thisMessageID]["timer"]);
        delete activeNotifications[thisMessageID];
    }

    //timer to remove notification and corresponding entry
    const timeoutId = setTimeout(() => {
        notification.remove();
        delete activeNotifications[thisMessageID];
    }, secondsVisible*1000);

    //save notification info entry so can be prematurely canceled
    activeNotifications[thisMessageID] = {};
    activeNotifications[thisMessageID]["timer"] = timeoutId;
    activeNotifications[thisMessageID]["button"] = notification;
}
