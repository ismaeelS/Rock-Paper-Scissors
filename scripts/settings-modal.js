document.querySelector("#ask-before-remove").addEventListener("change", (e) => {
    modalSettings.askBeforeRemove = e.target.checked;
    alert("Remove Button Notification Settings Change Saved")
});

function openSettingsModal() {
    updateSettingsModal();

    //clear any existing file
    document.querySelector("#file-input").value = null;

    //scroll to the most recently created button when settings is opened
    document.querySelector(".button-settings").lastElementChild.scrollIntoView();

    settingsModalIsOpen = true;
    document.querySelector(".modal-container").style.visibility = 'visible';
}

//ideally would have a check if there are unsaved values before allowing the modal to close
function closeSettingsModal() {
    document.querySelector(".js-gear-icon").classList.remove("keep-rotating");

    settingsModalIsOpen = false;
    document.querySelector(".modal-container").style.visibility = 'hidden';
}

/**
 * 
 * @returns null
 * gets user input on new weapon. if no input or weapon already exists, exit
 * otherwise add the new weapon to the modal weapons
 */
function addWeaponToSettings() {
    let newWeaponName = prompt("Enter the new button's name (up to 10 characters)");
    if (!newWeaponName) return;

    newWeaponName = formatWeaponName(newWeaponName);

    if (Object.keys(modalWeapons).includes(newWeaponName)) {
        alert("This button already exists");
        return;
    }

    modalWeapons[newWeaponName] = {};
    modalWeapons[newWeaponName]["beats"] = [];
    modalWeapons[newWeaponName]["ties"] = [];

    updateSettingsModal();
}

function formatWeaponName(attemptedWeaponName) {
    //remove non alphanumeric values, remove leading numbers and periods, lowercase and truncate
    attemptedWeaponName = attemptedWeaponName.replace(/[^0-9a-z]/gi, '').toLowerCase().substring(0,10);

    //if only numbers are given, set the name
    if (!isNaN(attemptedWeaponName)) attemptedWeaponName = "beepboop";

    //if too many w or m
    const numberofMs = (attemptedWeaponName.match(new RegExp("m", "g")) || []).length;
    if (numberofMs > 4) attemptedWeaponName = "m";
    const numberofWs = (attemptedWeaponName.match(new RegExp("w", "g")) || []).length;
    if (numberofWs > 4) attemptedWeaponName = "w";

    return attemptedWeaponName;
}

function undoSettingsChanges() {
    //the reset button type resets the autoplay interval also so the timeout restores it
    setTimeout(function() {
        document.querySelector("#autoplay-interval").value = (modalSettings.autoplayInterval)/1000;
    }, 0);

    if (!objectValuesAreTheSame(modalWeapons, weapons) || !objectValuesAreTheSame(modalSettings, settings)) {
        modalWeapons = JSON.parse(JSON.stringify(weapons));
        modalSettings = JSON.parse(JSON.stringify(settings))

        generateDefaultWeaponsHTML();
        setupWeaponButtonListeners();
        updateSettingsModal();
    } 
}

function restoreDefaultSettings() {
    if ((!objectValuesAreTheSame(modalWeapons, defaultWeapons) || !objectValuesAreTheSame(modalSettings, defaultSettings))
        && confirm("Do you sure you want to restore default settings? All new buttons will be erased.")) {
        
        weapons = JSON.parse(JSON.stringify(defaultWeapons));
        settings = JSON.parse(JSON.stringify(defaultSettings));

        localStorage.removeItem("weapons");
        localStorage.removeItem("settings");

        generateDefaultWeaponsHTML();
        setupWeaponButtonListeners();
        updateSettingsModal();
    }
}

// credits to https://www.youtube.com/watch?v=8s3u656gpkk
function objectValuesAreTheSame(objA, objB) {

    //recursion base cases
    if (objA === objB) return true;

    if (objA == null || objB == null) return false;

    if (String(objA) == "NaN" || String(objB) == "NaN") {
        return String(objA) === String(objB); 
    }
    // doesnt seem to handle nested booleans without the below check
    else if (typeof objA === "boolean" && typeof objB === "boolean") {
        return objA === objB;
    }
    else if (objA.toFixed || objB.toFixed) {
        return objA === objB;
    }

    const specials = ["function", "symbol", "string"];

    if (specials.includes(typeof objA) || specials.includes(typeof objB)) {
        return String(objA) === String(objB);
    }

    //ignore the button key
    const keys1 = String(Object.keys(objA).filter(key => key !== "button"));
    const keys2 = String(Object.keys(objB).filter(key => key !== "button"));

    //if the keys are either not matching or if they are matching but in a different order
    //handles the case when still default buttons but user has changed order
    if (keys1 !== keys2) {
        return false;
    }

    for (const key of Object.keys(objA)) {
        //ignore the button key and value
        if (key === "button") {
            continue;
        }
        if (!objectValuesAreTheSame(objA[key], objB[key])) return false;
    }

    return true;
}

//https://stackoverflow.com/questions/750032/reading-file-contents-on-the-client-side-in-javascript-in-various-browsers
function uploadFile() {
    if (confirm("Are you sure you want to overwrite your current settings, buttons and score?")) {
        const fileInputElement = document.querySelector("#file-input");

        fileInputElement.addEventListener("change", (e) => {
            checkAndUseFile(e);
        });
    }
}

async function checkAndUseFile(event) {
    const file = event.target.files.item(0)
    const text = await file.text();

    fileData = JSON.parse(text);

    const fileError = validateInputFile(fileData);

    const fileDataDiffersFromCurrentData = !objectValuesAreTheSame(score, fileData["score"]) || 
    !objectValuesAreTheSame(settings, fileData["settings"]) || 
    !objectValuesAreTheSame(weapons, fileData["weapons"]);
    
    if (!fileError && fileDataDiffersFromCurrentData) {
        score = JSON.parse(JSON.stringify(fileData["score"]));
        settings = JSON.parse(JSON.stringify(fileData["settings"]));
        weapons = JSON.parse(JSON.stringify(fileData["weapons"]));

        localStorage.setItem("score", JSON.stringify(score));
        localStorage.setItem("settings", JSON.stringify(settings));
        localStorage.setItem("weapons", JSON.stringify(weapons));

        closeSettingsModal();
        initializeDefaultGameState();
    }
    else {
        alert(fileError);
    }

    document.querySelector("#file-input").value = null;
}

function validateInputFile(fileData) {
    if (fileData === "") {
        return "File is empty"
    }

    const fileDataKeys = Object.keys(fileData);
    const gameKeys = ["score", "settings", "weapons"];

    for (let i = 0; i < gameKeys.length; i++) {
        const currentGameKey = gameKeys[i];

        if (!fileDataKeys.includes(currentGameKey)) {
            return `The file is missing the ${currentGameKey} key`;
        }
    }

    const fileDataSettingsKeys = Object.keys(fileData["settings"]);
    const settingsKeys = Object.keys(settings);

    for (let i = 0; i < settingsKeys.length; i++) {
        const currentSettingsKey = settingsKeys[i];

        if (!fileDataSettingsKeys.includes(currentSettingsKey)) {
            return `The file is missing the ${currentSettingsKey} settings key`;
        }
    }
    
    const fileDataScoreKeys = Object.keys(fileData["score"]);
    const scoreKeys = Object.keys(score);

    for (let i = 0; i < scoreKeys.length; i++) {
        const currentScoreKey = scoreKeys[i];

        if (!fileDataScoreKeys.includes(currentScoreKey)) {
            return `The file is must include "wins", "losses", and "ties" as score keys. ${currentScoreKey} is missing`;
        }

        if (fileData["score"][currentScoreKey] < 0) {
            return `${fileData["score"][currentScoreKey]} cannot be negative`
        }
    }

    if (typeof fileData["settings"]["autoplayInterval"] !== "number" || fileData.settings["autoplayInterval"] < 0 || fileData.settings["autoplayInterval"] > 10000) {
        return "autoplayInterval must be a valid number between 0 and 10000";
    }

    const fileDataSettingsShortcuts = fileData["settings"]["shortcuts"];
    const defaultShortcuts = ["?", "a", "x"];

    for (let i = 0; i < defaultShortcuts.length; i++) {
        const currentSettingsShortcut = defaultShortcuts[i];

        if (!fileDataSettingsShortcuts.includes(currentSettingsShortcut)) {
            return `The file is must include "?", "a", and "x" as shortcuts. ${currentSettingsShortcut} is missing`;
        }
    }

    if (typeof fileData["settings"]["askBeforeRemove"] !== "boolean") {
        return "askBeforeRemove must be a boolean";
    }

    const fileDataWeapons = Object.keys(fileData["weapons"]);

    if (fileDataWeapons.length < 1) {
        return "Weapons must contain at least one entry";
    }

    //begin formatting file data
    //check duplicate weapon names
    const trackUniqueNames = [];
    //take care of misformatted weapon names
    const weaponsExchange = {};

    for (let i = 0; i < fileDataWeapons.length; i++) {
        const currentWeapon = fileDataWeapons[i];
        
        if (!fileData["weapons"][currentWeapon]["beats"]) {
            return `${currentWeapon} does not have a key for beats`;
        }
        if(!fileData["weapons"][currentWeapon]["ties"]) {
            return `${currentWeapon} does not have a key for ties`;
        }

        const formattedWeaponName = formatWeaponName(currentWeapon);

        if (trackUniqueNames.includes(formattedWeaponName)) {
            return `${currentWeapon} is being processed as ${formattedWeaponName} and ${formattedWeaponName} is a duplicate`;
        }

        //if the weapon name does not fit the correct format, save them to update later
        if (currentWeapon !== formattedWeaponName) {
            weaponsExchange[currentWeapon] = formattedWeaponName;
        }
    }

    Object.keys(fileData["weapons"]).forEach((weaponToCheck) => {
        //if current key is the misnamed weapon, replace the whole key
        if (Object.keys(weaponsExchange).includes(weaponToCheck)) {
            fileData["weapons"][weaponsExchange[weaponToCheck]] = fileData["weapons"][weaponToCheck];
            delete fileData["weapons"][weaponToCheck];
        }
        //replace all instances of misnamed weapons in beats and ties of current key
        //names may have been updated with the formatted names to use the formatWeaponsName function
        Object.keys(weaponsExchange).forEach((misnamedWeapon) => {
            const indexOfBeatenWeapon = fileData["weapons"][formatWeaponName(weaponToCheck)]["beats"].indexOf(misnamedWeapon);
            const indexOfTiedWeapon = fileData["weapons"][formatWeaponName(weaponToCheck)]["ties"].indexOf(misnamedWeapon);

            if (indexOfBeatenWeapon > -1) {
                fileData["weapons"][formatWeaponName(weaponToCheck)]["beats"][indexOfBeatenWeapon] = weaponsExchange[misnamedWeapon];   
            }
            if (indexOfTiedWeapon > -1) {
                fileData["weapons"][formatWeaponName(weaponToCheck)]["ties"][indexOfTiedWeapon] = weaponsExchange[misnamedWeapon];   
            }
        });
    });
    //end formatting file data

    const weaponConflict = weaponsHaveConflicts(fileData["weapons"]);

    if (weaponConflict) {
        return weaponConflict;
    }

    return false;
}

//currently disabled input name change, but ideally would handle that
function weaponsHaveConflicts(arsenal) {
    if (arsenal.length < 1) {
        return "There are no valid buttons";
    }

    for (let i = 0; i < Object.keys(arsenal).length; i++) {
        const firstWeapon = Object.keys(arsenal)[i];

        //i+1 so can skip comparing a weapon to itself
        for (let j = i+1; j < Object.keys(arsenal).length; j++) {
            const secondWeapon = Object.keys(arsenal)[j];

            //if a pair of weapons beat each other
            if (arsenal[firstWeapon]["beats"].includes(secondWeapon) && arsenal[secondWeapon]["beats"].includes(firstWeapon)) {
                return `${firstWeapon} and ${secondWeapon} currently beat each other.\nPlease have only one of them have the ability to beat the other`;
            }

            //if the first weapon both beats and ties the other
            if (arsenal[firstWeapon]["beats"].includes(secondWeapon) && arsenal[firstWeapon]["ties"].includes(secondWeapon)) {
                return `${firstWeapon} currently beats and ties ${secondWeapon}.\nPlease have ${firstWeapon} either beat or tie ${secondWeapon} and not both`;
            }

            //if the second weapon both beats and ties the other
            if (arsenal[secondWeapon]["beats"].includes(firstWeapon) && arsenal[secondWeapon]["ties"].includes(firstWeapon)) {
                return `${secondWeapon} currently beats and ties ${firstWeapon}.\nPlease have ${secondWeapon} either beat or tie ${firstWeapon} and not both`;
            }

            //if the first weapon beats and ties the second (0ut first doesnt show tie in the dropdown)
            if (arsenal[firstWeapon]["beats"].includes(secondWeapon) && arsenal[secondWeapon]["ties"].includes(firstWeapon)) {
                return `${firstWeapon} currently beats and ties ${secondWeapon}.\nPlease have ${firstWeapon} either beat or tie ${secondWeapon} and not both`;
            }

            //if the second weapon beats and ties the second (but second doesnt show tie in the dropdown)
            if ((arsenal[secondWeapon]["beats"].includes(firstWeapon) && arsenal[firstWeapon]["ties"].includes(secondWeapon))) {
                return `${secondWeapon} currently beats and ties ${firstWeapon}.\nPlease have ${secondWeapon} either beat or tie ${firstWeapon} and not both`;
            }

            //if there is no association between the two weapons
            if (!(arsenal[firstWeapon]["beats"].includes(secondWeapon) || 
            arsenal[secondWeapon]["beats"].includes(firstWeapon) ||
            arsenal[firstWeapon]["ties"].includes(secondWeapon) || 
            arsenal[secondWeapon]["ties"].includes(firstWeapon))) {
                return `There is no assocaition between ${firstWeapon} and ${secondWeapon}.\nPlease have one of them beat the other or have them both tie`;
            }

            //ensure that both weapons tie each other if a tie association is found
            if (arsenal[secondWeapon]["ties"].includes(firstWeapon) && (!arsenal[firstWeapon]["ties"].includes(secondWeapon))) {
                if ((!arsenal[firstWeapon]["beats"].includes(secondWeapon)) && !arsenal[secondWeapon]["beats"].includes(firstWeapon)) {
                    arsenal[firstWeapon]["ties"].push(secondWeapon);
                }
            }
        }
    }
}

function saveFile() {
    const dataToSave = JSON.stringify({score: score, settings: settings, weapons: weapons});

    var a = document.createElement("a");
    var file = new Blob([dataToSave], {type: "application/json"});
    a.href = URL.createObjectURL(file);
    a.download = "rockpaperscissors_savefile.json";
    a.click();
    URL.revokeObjectURL(a.href);
}

//ideally would check if there are any form changes. if not then, would not execute
function submitNewSettings() {
    modalWeapons = {};
    modalSettings = {
        autoplayInterval: Number(document.querySelector("#autoplay-interval").value)*1000,
        shortcuts: ["?", "a", "x"],
        askBeforeRemove: document.querySelector("#ask-before-remove").checked,
    };

    // if user manually enter unsupported number, limit it. ideally would allow restricted typing
    if (modalSettings["autoplayInterval"] < 0) modalSettings["autoplayInterval"] = 0;
    if (modalSettings["autoplayInterval"] > 10000) modalSettings["autoplayInterval"] = 10000;

    const modalListOfEntries = document.querySelectorAll(".button-entry");

    //load all values into the temporary modal weapons object
    for (let index = 0; index < modalListOfEntries.length; index++) {
        const currentModalEntry = modalListOfEntries[index];

        let currentWeaponName = currentModalEntry.querySelector(`input.js-name-input`).value;
        let currentWeaponShortcut = currentModalEntry.querySelector(`input.js-shortcut-input`).value;

        modalWeapons[currentWeaponName] = {};

        let currentWeaponsDropdowns = currentModalEntry.querySelectorAll("select");

        if (modalListOfEntries.length > 1) {
            let currentWeaponBeats = Array.from(currentWeaponsDropdowns[0].selectedOptions).map(({ value }) => value);
            let currentWeaponTies = Array.from(currentWeaponsDropdowns[1].selectedOptions).map(({ value }) => value);

            modalWeapons[currentWeaponName]["beats"] = currentWeaponBeats;
            modalWeapons[currentWeaponName]["ties"] = currentWeaponTies;
        }
        else {
            modalWeapons[currentWeaponName]["beats"] = [];
            modalWeapons[currentWeaponName]["ties"] = [];
        }

        if (currentWeaponShortcut) {
            if (modalSettings["shortcuts"].includes(currentWeaponShortcut)) {
                alert("This shortcut already exists");

                return;
            }
            
            modalSettings["shortcuts"].push(currentWeaponShortcut);
            modalWeapons[currentWeaponName]["shortcut"] = currentWeaponShortcut;
        }
    }

    errorMessage = weaponsHaveConflicts(modalWeapons);

    if (!errorMessage) {
        weapons = JSON.parse(JSON.stringify(modalWeapons));
        settings = JSON.parse(JSON.stringify(modalSettings));

        generateDefaultWeaponsHTML();
        setupWeaponButtonListeners();
        
        closeSettingsModal();

        localStorage.setItem("settings", JSON.stringify(settings));
        localStorage.setItem("weapons", JSON.stringify(weapons));
    }
    else {
        alert(errorMessage);
    }
}