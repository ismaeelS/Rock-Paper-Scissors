const defaultWeapons = {
    rock: {
        beats: ["scissors"],
        ties: [],
        shortcut: "r",
    },
    paper: {
        beats: ["rock"],
        ties: [],
        shortcut: "p",
    },
    scissors: {
        beats: ["paper"],
        ties: [],
        shortcut: "s",
    },
};

const defaultSettings = {
    autoplayInterval: 2000,
    shortcuts: ["?", "a"],
    askBeforeRemove: true,
    showWarnings: false,
};

// import score from local storage if available or initialize a score starting at 0-0-0
let score = JSON.parse(localStorage.getItem("score")) || {
    wins: 0,
    losses: 0,
    ties: 0,
};

settings = JSON.parse(localStorage.getItem("settings")) || defaultSettings;
weapons = JSON.parse(localStorage.getItem("weapons")) || defaultWeapons;

let modalWeapons = {};
let modalSettings = {};
let modalScore = {};

let autoplaying = false;
let intervalId;
let settingsModalIsOpen = false;

const pageTitle = document.querySelector(".js-page-title");
const resultsParagraph = document.querySelector(".js-results-text");
const winRateParagraph = document.querySelector(".js-win-rate");

initializeDefaultGameState();

function initializeDefaultGameState() {
    generateDefaultWeaponsHTML();

    //add rock paper scissors into default settings for when user wants to restore default
    Object.keys(weapons).forEach((weapon) => {
        if (weapons[weapon]["shortcut"]) {
            defaultSettings.shortcuts.push(weapons[weapon]["shortcut"]);
        }
    });

    //set up listeners for the settings modal, the autoplay button, and the reset button
    document.querySelector(".js-gear-icon").addEventListener("click", (e) => {
        e.target.classList.add("keep-rotating");

        openSettingsModal();
    });

    document.querySelector(".js-plus-btn").addEventListener("click", () => {
        document.querySelector(".js-button-holder").classList.toggle("keep-rotating");

        updateButtonHolder();
    });

    document.querySelector(".js-close-btn").addEventListener("click", () => closeSettingsModal());
    document.querySelector("#modal-container").addEventListener("click", (e) => {
        if (e.target === (document.querySelector("#modal-container"))) closeSettingsModal();
    });

    document.querySelector(".js-add-btn").addEventListener("click", () => {addWeaponToSettings();});
    
    document.querySelector(".js-settings-undo-btn").addEventListener("click", () => {undoSettingsChanges();});
    document.querySelector(".js-modal-reset-score-btn").addEventListener("click", () => {
        if (resetScore()) {
            showNotification("success", "Score Has Been Reset");
        }
        else {
            showNotification("info", "The Score is already 0-0-0");
        }
    });
    document.querySelector(".js-modal-reset-score-btn").addEventListener("mouseenter", (e) => {
        showNotification("warning", "Score History Will Be Reset. Buttons Will Not Be Affected", e.target);
    });
    document.querySelector(".js-settings-restore-btn").addEventListener("click", () => {
        if (restoreDefaultSettings()) {
            showNotification("success", "Default Settings Have Been Restored");
        }
        else {
            showNotification("info", "Settings are Currently the Default");
        }
    });
    document.querySelector(".js-settings-restore-btn").addEventListener("mouseenter", (e) => {        
        showNotification("warning", "All Settings Will Be Reset. Score Will Not Be Affected", e.target);
    });
    document.querySelector(".js-reset-all-btn").addEventListener("click", () => {
        const ableToResetScore = resetScore();
        const ableToResetSettings = restoreDefaultSettings();

        if (!ableToResetScore && !ableToResetSettings) {
            showNotification("info", "Setting Are Already Default and the Score is already 0-0-0")
        }
        else {
            showNotification("success", "Default Settings Have Been Restored and the Score is Reset")
        }
    });
    document.querySelector(".js-reset-all-btn").addEventListener("mouseenter", (e) => {        
        showNotification("warning", "All Score Data and Settings Will Be Reset", e.target);
    });
    
    document.querySelector(".upload-btn").addEventListener("click", () => {uploadFile()});
    document.querySelector(".upload-btn").addEventListener("mouseenter", (e) => {
        showNotification("warning", "The File Will Attempt to Overwrite Current Settings. This Cannot Be Undone", e.target);
    });
    document.querySelector(".save-btn").addEventListener("click", () => {saveFile()});
    document.querySelector(".js-presets-btn").addEventListener("click", () => {loadPresets()});
    document.querySelector(".js-submit-btn").addEventListener("click", () => {submitNewSettings()});

    document.querySelector(".js-autoplay-btn").addEventListener("click", () => {autoplayGame();});
    document.querySelector(".js-autoplay-btn").addEventListener("mouseenter", (e) => {
        if(!autoplaying) {
            showNotification("warning", "While Autoplaying, You Will No Longer Be Able to Select Your Moves", e.target);
        }
        else {
            showNotification("info", "Click Autoplay Again to End Autoplay", e.target);
        }
    });
    document.querySelector(".js-reset-score-btn").addEventListener("click", () => {
        if (resetScore()) {
            showNotification("success", "Score Has Been Reset");
        }
        else {
            showNotification("info", "The Score is already 0-0-0");
        }
    });
    document.querySelector(".js-reset-score-btn").addEventListener("mouseenter", (e) => {
        showNotification("warning", "All Score Data Will Be Reset. Buttons Will Not Be Affected", e.target, 5);
    });

    setupWeaponButtonListeners();

    updateScoreboard();
    updateButtonHolder();
    updateSettingsModal();
}

function generateDefaultWeaponsHTML() {
    const arsenal = document.querySelector(".js-button-holder");

    let arsenalHTML = `<button class="js-random-btn random-btn move-btn">random</button>`;

    Object.keys(weapons).forEach(weapon => {
        arsenalHTML += `<button class="js-${weapon}-btn move-btn" data-button-name="${weapon}">${weapon}</button>`;
    });

    arsenal.innerHTML = arsenalHTML;
}

function setupWeaponButtonListeners() {
    //set up event listeners for the random button
    const randomButton = document.querySelector(".js-random-btn");
    randomButton.addEventListener("click", () => {if(!autoplaying) playOneRound(chooseRandomWeapon())});
    randomButton.addEventListener("mouseover", () => {if(!autoplaying)
        setButtonBackground(randomButton, "random");
    });
    randomButton.addEventListener("mouseout", () => {setButtonBackground(randomButton, "random", true);});

    //set up event listeners for each weapon
    Object.keys(weapons).forEach(weapon => {
        //find the corresponding button and assign it to the weapons object
        const currentWeaponButton = document.querySelector(`.js-${weapon}-btn`);
        weapons[weapon]["button"] = currentWeaponButton;

        //add event listeners to play the weapon and to toggle the weapon background
        currentWeaponButton.addEventListener("click", () => {if(!autoplaying) playOneRound(weapon)});

        currentWeaponButton.addEventListener("mouseover", () => {
            if(!autoplaying) setButtonBackground(currentWeaponButton, weapon);
        });

        currentWeaponButton.addEventListener("mouseout", () => {
            if(!autoplaying) setButtonBackground(currentWeaponButton, weapon, true);
        });

        //add the weapon shortcut to the settings object
        //only if the shortcut is not empty and not already somehow in the array (should never happen)
        if (weapons[weapon]["shortcut"] && !settings["shortcuts"].includes(weapons[weapon]["shortcut"]))
            settings["shortcuts"].push(weapons[weapon]["shortcut"]);
    });

    document.addEventListener("keyup", function(event) {
        const keyPressed = event.key.toLowerCase();

        // when the modal is open, allow for the following keyboard instructions
        if (settingsModalIsOpen) {
            if (keyPressed == "escape") {
                closeSettingsModal();
            }
            else if (keyPressed == "enter") {
                submitNewSettings();
            }
        }
        else {
            if (keyPressed === "a") {
                autoplayGame();
            }
            else if (keyPressed === "?") {
                playOneRound(chooseRandomWeapon());
            }
            //if the pressed key is longer than one char (alt, control, escape, etc) or is not a letter
            else if (keyPressed.length > 1 || keyPressed.toLowerCase() === keyPressed.toUpperCase()) {
                ;
            }
            else if (!settings["shortcuts"].includes(keyPressed)) {
                showNotification("info", `The following key is not assigned: ${keyPressed}`);
            }
            //if the pressed key is recognized by the settings object as a valid shortcut, play the weapon
            else {
                Object.keys(weapons).forEach(weapon => {
                    if (weapons[weapon]["shortcut"] === keyPressed) {
                        playOneRound(weapon);
                    }
                });
            }
        }
    });

    modalWeapons = JSON.parse(JSON.stringify(weapons));

    Object.keys(weapons).forEach(weapon => {
        modalWeapons[weapon]["button"] = weapons[weapon]["button"];
    });

    //reassign default to include rock, paper, scissors for comparing checks in restore and undo. then reassign autoplay interval
    modalSettings = JSON.parse(JSON.stringify(settings));
}

function setButtonBackground(buttonElement, weaponName, clearBackground=false) {
    buttonElement.style.backgroundImage = (clearBackground) ? "" : `url("images/${imageNames.includes(weaponName) ? weaponName : "unknown"}.jpg")`;
}

function updateButtonHolder() {
    const buttonHolderElem = document.querySelector(".js-button-holder");
    const roundsPlayed = score.wins+score.ties+score.losses;

    if (!roundsPlayed || buttonHolderElem.classList.contains("keep-rotating")) {
        document.querySelector(".js-button-holder").classList.remove("restrict-button-holder");
    }
    else {
        document.querySelector(".js-button-holder").classList.add("restrict-button-holder");
    }
}

/**
 * Update the webelements with the current scores and set the win rate text color to match success this game
 */
function updateScoreboard() {
    const roundsPlayed = score.wins+score.ties+score.losses;
    const winRate = score.wins/roundsPlayed;

    document.querySelector(".js-scoreboard").innerHTML = (roundsPlayed < 1) ? "" :
    `Your record is
    ${score.wins} win${score.wins === 1?"":"s"}, 
    ${score.losses} loss${score.losses === 1?"":"es"}, and 
    ${score.ties} tie${score.ties === 1?"":"s"}`

    winRateParagraph.innerHTML = (roundsPlayed) ?
    `You have played ${roundsPlayed} round${roundsPlayed === 1?"":"s"} and your win rate is ${(winRate*100).toFixed(2)}%` : "";

    if (!roundsPlayed || winRate === 1/3) {
        winRateParagraph.classList.remove("turn-text-green");
        winRateParagraph.classList.remove("turn-text-red");
    }
    else {
        winRateParagraph.classList.add(`turn-text-${winRate > (1/3) ? "green": "red"}`);
    }

    //hide the reset button if there are no rounds to reset
    document.querySelector(".js-reset-score-btn").style.visibility = (roundsPlayed) ? "visible": "hidden";
    
    updateButtonHolder();

    modalScore = JSON.parse(JSON.stringify(score));
}

/**
 * @returns {string} Randomly generates a number and compares it to the index of each weapon to determine a weapon
 */
function chooseRandomWeapon() {
    const chosenWeaponAtRandom = Math.random();
    const possibleWeapons = Object.keys(weapons);

    for (let i = 0; i < possibleWeapons.length; i++) {
        if (chosenWeaponAtRandom < (i+1)/(possibleWeapons.length)) {
            return possibleWeapons[i];
        }
    }
}

function autoplayGame() {
    if (!autoplaying) {
        playOneRandomRound();
        intervalId = setInterval(playOneRandomRound, settings.autoplayInterval);

        document.querySelector(".js-autoplay-btn").classList.add("rotating-border");
        autoplaying = true;
    }
    else {
        Object.keys(weapons).forEach(weapon => {
            setButtonBackground(weapons[weapon]["button"], weapon, true);
        });
        
        clearInterval(intervalId);
        document.querySelector(".js-autoplay-btn").classList.remove("rotating-border");
        autoplaying = false;
    }
}

function playOneRandomRound() {
    Object.keys(weapons).forEach(weapon => {
        setButtonBackground(weapons[weapon]["button"], weapon, true);
    });

    const bothWeapons = playOneRound(chooseRandomWeapon());

    //show the weapon background when it is picked during autoplay 
    bothWeapons.forEach(weapon => {
        setButtonBackground(weapons[weapon]["button"], weapon);
    });
}

function playOneRound(selectedPlayerWeapon) {
    const computerWeapon = chooseRandomWeapon();

    let roundResultMessage = "";

    resetColors();

    if (selectedPlayerWeapon === computerWeapon || weapons[selectedPlayerWeapon]["ties"].includes(computerWeapon)) {
        roundResultMessage = "You Tie"
        score.ties++;
    }
    else if (weapons[selectedPlayerWeapon]["beats"].includes(computerWeapon)) {
        roundResultMessage = "You Win"
        score.wins++;
        
        pageTitle.classList.add("turn-text-green");
        resultsParagraph.classList.add("turn-text-green");
        weapons[selectedPlayerWeapon]["button"].classList.add("turn-border-green");
    }
    else {
        roundResultMessage = "You Lose"
        score.losses++;
        
        pageTitle.classList.add("turn-text-red");
        resultsParagraph.classList.add("turn-text-red");
        weapons[selectedPlayerWeapon]["button"].classList.add("turn-border-red");   
    }

    document.querySelector(".js-round-picks").innerHTML = 
        `You played ${selectedPlayerWeapon} and the computer played ${computerWeapon}`;
    
    document.querySelector(".js-round-result").innerHTML = roundResultMessage;

    localStorage.setItem("score", JSON.stringify(score));

    updateScoreboard();

    return [selectedPlayerWeapon, computerWeapon];
}

/**
 * Only activate if score is not 0-0-0 and user confirms the reset
 * Reset the score to 0-0-0, clear the paragraphs of results,
 * clear local storage, reset the border and text colors, display 0-0-0
 */
function resetScore() {
    if (score.wins + score.losses + score.ties) {
        
        score.wins = 0;
        score.losses = 0;
        score.ties = 0;

        document.querySelector(".js-round-picks").innerHTML = "";
        document.querySelector(".js-round-result").innerHTML = "";

        localStorage.removeItem("score");

        resetColors();

        updateScoreboard();

        return true;
    }
    
    return false;
}

/**
 * 
 * @param {boolean} resetTitleAndButtonBorders
 * for each element, remove the css classes for border/text colors
 */
function resetColors() {
    ["green", "red"].forEach(color => {
        pageTitle.classList.remove(`turn-text-${color}`);
        resultsParagraph.classList.remove(`turn-text-${color}`);
        winRateParagraph.classList.remove(`turn-text-${color}`);
    });

    Object.keys(weapons).forEach(weapon => {
        ["green", "red"].forEach(color => {
            weapons[weapon]["button"].classList.remove(`turn-border-${color}`);
        });
    });
}

/**
 * set up input, input values, etc (unneccessary if using a framework)
 */
function updateSettingsModal() {
    document.querySelector("#autoplay-interval").value = (modalSettings.autoplayInterval)/1000;
    document.querySelector("#ask-before-remove").checked = modalSettings.askBeforeRemove;
    document.querySelector("#show-warnings").checked = modalSettings.showWarnings;

    const buttonSettingsSection = document.querySelector(".button-settings");
 
    let buttonSettingsSectionHTML = "";

    // set up the html for each button entry. if there is only one entry, do not show ties, beats or the remove
    Object.keys(modalWeapons).forEach(weapon => {
        buttonSettingsSectionHTML += 
        `<div class="js-${weapon}-button-entry button-entry">
            <div class="entry-name-shortcut">
                <div>
                    <label for="${weapon}-name">Name</label>
                    <input type="text" name="${weapon}-name" id="${weapon}-name" class="name-input js-name-input" value="${weapon}" maxlength="10" disabled>
                </div>
                <div>
                    <label for="${weapon}-shortcut">Shortcut</label>
                    <input type="text" name="${weapon}-shortcut" id="${weapon}-shortcut" class="js-shortcut-input" value="${(modalWeapons[weapon]["shortcut"]) ? modalWeapons[weapon]["shortcut"] : ""}" maxlength="1">
                </div>
            </div>
            
            ${Object.keys(modalWeapons).length > 1 ? 
                `<div class="entry-comparison-remove">
                    <div>
                        <label for="${weapon}-beats">Beats:</label>
                        <select name="${weapon}-beats" id="${weapon}-beats" multiple>
                            ${createModalDropdownOptionsHTML(weapon, "beats")}
                        </select>
                    </div>
                    <div>
                        <label for="${weapon}-ties">Ties:</label>
                        <select name="${weapon}-ties" id="${weapon}-ties" multiple>
                            ${createModalDropdownOptionsHTML(weapon, "ties")}
                        </select>
                    </div>
                    <button type="button" class="js-remove-btn remove-btn" data-button-name="${weapon}">Remove</button>
                </div>` : ""}            
        </div>`;
    });

    buttonSettingsSection.innerHTML = buttonSettingsSectionHTML;

    document.querySelectorAll(".js-remove-btn").forEach((removeButton) => {
        setUpRemoveButtonListener(removeButton);
    });
    
    //scroll to the most recently created button when modal is updated
    document.querySelector(".button-settings").lastElementChild.scrollIntoView();

    //ideally the dropdown options would update when a new weapon is added
}

function createModalDropdownOptionsHTML(chosenWeapon, comparison) {
    let optionValuesHTML = "";

    Object.keys(modalWeapons).forEach(weapon => {
        if (chosenWeapon !== weapon) {
            optionValuesHTML += 
                `<option 
                    ${modalWeapons[chosenWeapon][comparison].includes(weapon) 
                    ? "selected" : ""} value="${weapon}">${weapon}
                </option>`
        }
    });

    return optionValuesHTML;
}

function setUpRemoveButtonListener(removeButton) {
    removeButton.addEventListener("click", () => {
        const currentWeaponName = removeButton.dataset.buttonName;

        if (!modalSettings.askBeforeRemove || confirm(`Are you sure you want to remove the ${currentWeaponName} button?`)) {
            const buttonEntry = document.querySelector(`.js-${currentWeaponName}-button-entry`);

            modalSettings["shortcuts"] = modalSettings["shortcuts"].filter(shortcut => 
                shortcut !== modalWeapons[currentWeaponName]["shortcut"]);

            Object.keys(modalWeapons).forEach((weaponKey) => {
                if (weaponKey === currentWeaponName) {
                    delete modalWeapons[weaponKey];
                }
                else {
                    modalWeapons[weaponKey]["beats"] = modalWeapons[weaponKey]["beats"].filter(weaponNameinBeats => 
                        weaponNameinBeats !== currentWeaponName);
                    
                    modalWeapons[weaponKey]["ties"] = modalWeapons[weaponKey]["ties"].filter(weaponNameinTies => 
                        weaponNameinTies !== currentWeaponName);
                }
            });

            buttonEntry.remove();

            updateSettingsModal();
        }
    });
}