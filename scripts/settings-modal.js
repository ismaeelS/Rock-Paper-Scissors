function openSettingsModal() {
    updateSettingsModal();

    //scroll to the most recently created button when settings is opened
    document.querySelector(".button-settings div:last-child").scrollIntoView();

    settingsModalIsOpen = true;
    settingsModal.style.visibility = 'visible';
}

//HALP do some checks to make sure there isnt unsaved data by comparing savedSettings to settings
//HALP HAVE AN INDICATOR THAT CHANGES HAVE BEEN MADE BUT NOT SAVED like a red border and some text
//HALP need event listeners on each form input to update modal weapons/settings and know if unsaved changes
function closeSettingsModal() {
    // console.log("there are unsaved changes: ", (objectValuesAreDifferent(modalWeapons, weapons) || objectValuesAreDifferent(modalSettings, settings)));
    document.querySelector(".js-gear-icon").classList.remove("keep-rotating");

    settingsModalIsOpen = false;
    settingsModal.style.visibility = 'hidden';
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

    //HALP SHOULD NOT ACCEPT A NAME THAT STARTS WITH A NUMBER
    newWeaponName = newWeaponName.replace(/[^A-Za-z0-9]/g, '').toLowerCase().substring(0,10);

    if (Object.keys(modalWeapons).includes(newWeaponName)) {
        alert("This button already exists");
        return;
    }

    modalWeapons[newWeaponName] = {};
    modalWeapons[newWeaponName]["beats"] = [];
    modalWeapons[newWeaponName]["ties"] = [];

    updateSettingsModal();
}

function submitNewSettings() {
    modalWeapons = {};
    modalSettings = {
        "autoPlayInterval": Number(document.querySelector("#autoplay-interval").value)*1000,
        "shortcuts": ["?", "a", "x"],
    };

    const modalListOfEntries = document.querySelectorAll("form .button-settings div");

    //load all values into the temporary modal weapons object
    for (let index = 0; index < modalListOfEntries.length; index++) {
        const currentModalEntry = modalListOfEntries[index];

        let currentWeaponName = currentModalEntry.querySelector(`input.js-name-input`).value;
        let currentWeaponShortcut = currentModalEntry.querySelector(`input.js-shortcut-input`).value;

        if (currentWeaponShortcut) {
            if (modalSettings["shortcuts"].includes(currentWeaponShortcut)) {
                alert("This shortcut already exists");

                return;
            }
            
            modalSettings["shortcuts"].push(currentWeaponShortcut);
        }

        let currentWeaponsDropdowns = currentModalEntry.querySelectorAll("select");

        if (modalListOfEntries.length > 1) {
            let currentWeaponBeats = Array.from(currentWeaponsDropdowns[0].selectedOptions).map(({ value }) => value);
            let currentWeaponTies = Array.from(currentWeaponsDropdowns[1].selectedOptions).map(({ value }) => value);

            modalWeapons[currentWeaponName] = {};
            modalWeapons[currentWeaponName]["beats"] = currentWeaponBeats;
            modalWeapons[currentWeaponName]["ties"] = currentWeaponTies;
        }
        else {
            modalWeapons[currentWeaponName] = {};
            modalWeapons[currentWeaponName]["beats"] = [];
            modalWeapons[currentWeaponName]["ties"] = [];
        }
        
        modalWeapons[currentWeaponName]["shortcut"] = currentWeaponShortcut;
    }

    errorMessage = weaponsHaveConflicts(modalWeapons);

    if (!errorMessage) {
        weapons = JSON.parse(JSON.stringify(modalWeapons));
        settings = JSON.parse(JSON.stringify(modalSettings));

        generateDefaultWeaponsHTML();
        setupWeaponButtonListeners();
        
        closeSettingsModal();

        localStorage.setItem("weapons", JSON.stringify(weapons));
        localStorage.setItem("settings", JSON.stringify(settings));
    }
    else {
        alert(errorMessage);
    }
}

//current fails if name gets changed HALP. currently disabled input to handle
function weaponsHaveConflicts(arsenal) {
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

function undoSettingsChanges() {
    //the reset button type resets the autoplay interval also so the timeout restores it
    setTimeout(function() {
        document.querySelector("#autoplay-interval").value = (modalSettings.autoPlayInterval)/1000;
    }, 0);

    if (objectValuesAreDifferent(modalWeapons, weapons) || objectValuesAreDifferent(modalSettings, settings)) {
        modalWeapons = JSON.parse(JSON.stringify(weapons));
        modalSettings = JSON.parse(JSON.stringify(settings))

        generateDefaultWeaponsHTML();
        setupWeaponButtonListeners();
        updateSettingsModal();
    } 
}

function restoreDefaultSettings() {
    if ((objectValuesAreDifferent(modalWeapons, defaultWeapons) || objectValuesAreDifferent(modalSettings, defaultSettings)) 
        && confirm("Do you sure you want to restore default settings? All new buttons will be erased.")) {
        weapons = JSON.parse(JSON.stringify(defaultWeapons));
        settings = JSON.parse(JSON.stringify(defaultSettings));

        localStorage.setItem("weapons", JSON.stringify(weapons));
        localStorage.setItem("settings", JSON.stringify(settings));

        generateDefaultWeaponsHTML();
        setupWeaponButtonListeners();
        updateSettingsModal();
    }
}

//compare the values in each object. if an object contains buttons (webelement), remove that key
function objectValuesAreDifferent(objA, objB) {
    if (Object.keys(objA).length !== Object.keys(objB).length) return true;

    const tempA = JSON.parse(JSON.stringify(objA));
    const tempB = JSON.parse(JSON.stringify(objB));
    
    Object.keys(tempA).forEach(key => {
        if(tempA[key]["button"]) delete tempA[key]["button"];
    });
    
    Object.keys(tempB).forEach(key => {
        if(tempB[key]["button"]) delete tempB[key]["button"];
    });

    return JSON.stringify(Object.entries(tempA)) !== JSON.stringify(Object.entries(tempB));

    // HALP CHECK IF YOU DONT NEED TO SORT
    // REMOVED SORT IN THE SPECIFIC CASE WHERE USER REMOVES TWO OF THE ORIGINAL BUTTONS
    // THEN READDS THEM IN A DIFFERENT ORDER (E.G. PAPER, SCISSORS, ROCK)
    // return JSON.stringify(Object.entries(tempA).sort()) !== JSON.stringify(Object.entries(tempB).sort());
}