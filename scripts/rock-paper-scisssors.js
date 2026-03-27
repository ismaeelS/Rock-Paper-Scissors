import { settings } from "../data/settings.js";
import { weapons } from "../data/weapons.js";
import { imageNames } from "../data/imageNames.js";

import { assignValuesToObject, checkIfObjectValuesAreTheSame } from "./utils/object-helpers.js";

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

const score = {};

// import values from local storage if available or initialize with defaults
assignValuesToObject(score, JSON.parse(localStorage.getItem("score")), {
    wins: 0,
    losses: 0,
    ties: 0,
});
assignValuesToObject(settings, JSON.parse(localStorage.getItem("settings")), defaultSettings);
assignValuesToObject(weapons, JSON.parse(localStorage.getItem("weapons")), defaultWeapons);

const modalWeapons = {};
const modalSettings = {};
const modalScore = {}; //relevant when uploading files that contain score data

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
            showNotification("info", "Setting Are Already Default and the Score is already 0-0-0");
        }
        else {
            showNotification("success", "Default Settings and the Score Have Been Reset");
            closeSettingsModal();
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

    assignValuesToObject(modalWeapons, weapons);

    Object.keys(weapons).forEach(weapon => {
        modalWeapons[weapon]["button"] = weapons[weapon]["button"];
    });

    //assign modal settings to include the current settings
    assignValuesToObject(modalSettings, settings);
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

    //hide the game summary and reset button if there are no rounds to reset
    document.querySelector(".js-game-summary-and-reset-score").style.visibility = (roundsPlayed) ? "visible": "hidden";

    //reset the colors if the score has been reset
    if (!roundsPlayed) resetColors();
    
    updateButtonHolder();

    assignValuesToObject(modalScore, score);
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

    localStorage.removeItem("score");
    
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

            //remove the corresponding shortcut
            modalSettings["shortcuts"] = modalSettings["shortcuts"].filter(shortcut => 
                shortcut !== modalWeapons[currentWeaponName]["shortcut"]);

            //remove the button object and all associations to it from other buttons
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

//HALP BELOW IS ALL MODAL CODE. FIND OUT HOW TO SEPERATE
const modalContainerEle = document.querySelector("#modal-container");

document.querySelector("#ask-before-remove").addEventListener("change", (e) => {
    modalSettings.askBeforeRemove = e.target.checked;

    showNotification("info", "Setting In Effect, But Not Saved");
});
document.querySelector("#show-warnings").addEventListener("change", (e) => {
    modalSettings.showWarnings = e.target.checked;

    showNotification("info", "Setting In Effect, But Not Saved");
});

function openSettingsModal() {
    modalContainerEle.removeAttribute("class");
    modalContainerEle.classList.add("fold-animation");

    updateSettingsModal();

    //clear any existing file
    document.querySelector("#file-input").value = null;

    //scroll to the most recently created button when settings is opened
    document.querySelector(".button-settings").lastElementChild.scrollIntoView();

    //allow the user to see all buttons in the background
    document.querySelector(".js-button-holder").classList.remove("restrict-button-holder");
    settingsModalIsOpen = true;
}

//ideally would have a check if there are unsaved values before allowing the modal to close
function closeSettingsModal() {
    modalContainerEle.classList.add("out");
    
    if (!checkIfObjectValuesAreTheSame(modalSettings, settings) || !checkIfObjectValuesAreTheSame(modalWeapons, weapons)) {
        showNotification("info", "Button Edits Not Saved. Please Click Submit to Save Changes");
    }
    
    document.querySelector(".js-gear-icon").classList.remove("keep-rotating");

    updateButtonHolder();

    settingsModalIsOpen = false;
}

/**
 * 
 * @returns null
 * gets user input on new weapon. if no input or weapon already exists, exit
 * otherwise add the new weapon to the modal weapons
 */
function addWeaponToSettings() {
    //limit buttons to the number of letters (case if every button has a shortcut + a for autoplay)
    if (Object.keys(modalWeapons).length < 25) {
        const newWeaponName = formatWeaponName(prompt("Enter the new button's name (up to 10 characters)"));
        if (!newWeaponName) return;

        if (Object.keys(modalWeapons).includes(newWeaponName)) {
            showNotification("error", "This Button Already Exists");
            return;
        }
        else if (newWeaponName === "uncreative") {
            showNotification("info", "Uncreative Weapon Name :[");
        }

        modalWeapons[newWeaponName] = {};
        modalWeapons[newWeaponName]["beats"] = [];
        modalWeapons[newWeaponName]["ties"] = [];

        //modal is updated based on modal settings values but the autoplay interval value, if changed, is not yet saved
        const unsavedAutoplayIntervalSettings = document.querySelector("#autoplay-interval").value;
        
        updateSettingsModal();

        document.querySelector("#autoplay-interval").value = unsavedAutoplayIntervalSettings;
    }
    else {
        showNotification("error", "Maximum Number of Buttons Reached");
    }
}

function formatWeaponName(attemptedWeaponName) {
    if (!attemptedWeaponName) return null;

    //remove non alphanumeric characters, lowercase, and truncate
    attemptedWeaponName = attemptedWeaponName.replace(/[^0-9a-z]/ig, "").toLowerCase().substring(0,10);

    //if too many w or m
    const numberofMs = (attemptedWeaponName.match(new RegExp("m", "g")) || []).length;
    if (numberofMs > 4) attemptedWeaponName = "m";
    const numberofWs = (attemptedWeaponName.match(new RegExp("w", "g")) || []).length;
    if (numberofWs > 4) attemptedWeaponName = "w";

    const creativeExceptions = ["m", "w", "x"]

    if (attemptedWeaponName.length == 1 && !creativeExceptions.includes(attemptedWeaponName)) {
        attemptedWeaponName = "uncreative";
    }

    //if only numbers are given, set the name
    if (!isNaN(attemptedWeaponName)) attemptedWeaponName = "beepboop";

    return attemptedWeaponName;
}

function undoSettingsChanges() {
    //the reset button type resets the autoplay interval also so the timeout restores it
    setTimeout(function() {
        document.querySelector("#autoplay-interval").value = (modalSettings.autoplayInterval)/1000;
    }, 0);

    if (!checkIfObjectValuesAreTheSame(modalWeapons, weapons) || !checkIfObjectValuesAreTheSame(modalSettings, settings)) {
        assignValuesToObject(modalWeapons, weapons);
        assignValuesToObject(modalSettings, settings);

        updateSettingsModal();

        showNotification("success", "Recent Edits Have Been Reversed");
    } 
}

function restoreDefaultSettings() {
    if (!checkIfObjectValuesAreTheSame(modalWeapons, defaultWeapons) || !checkIfObjectValuesAreTheSame(modalSettings, defaultSettings)) {
        assignValuesToObject(weapons, defaultWeapons);
        assignValuesToObject(settings, defaultSettings);

        localStorage.removeItem("settings");
        localStorage.removeItem("weapons");

        generateDefaultWeaponsHTML();
        setupWeaponButtonListeners();
        updateSettingsModal();

        return true;
    }
    return false;
}

//https://stackoverflow.com/questions/750032/reading-file-contents-on-the-client-side-in-javascript-in-various-browsers
function uploadFile() {
    const fileInputElement = document.querySelector("#file-input");

    fileInputElement.addEventListener("change", (e) => {
        checkAndUseFile(e);
    });
}

async function checkAndUseFile(event) {
    const file = event.target.files.item(0)
    const text = await file.text();

    fileData = JSON.parse(text);

    const fileError = validateInputFile(fileData);

    const fileDataDiffersFromCurrentData = !checkIfObjectValuesAreTheSame(score, fileData["score"]) || 
    !checkIfObjectValuesAreTheSame(modalSettings, fileData["settings"]) || 
    !checkIfObjectValuesAreTheSame(modalWeapons, fileData["weapons"]);
    
    if (!fileError && fileDataDiffersFromCurrentData) {
        assignValuesToObject(modalScore, fileData["score"]);
        assignValuesToObject(modalSettings, fileData["settings"]);
        assignValuesToObject(modalWeapons, fileData["weapons"]);

        updateSettingsModal();

        showNotification("success", "File Successfully Uploaded");
    }
    else if (!fileDataDiffersFromCurrentData) {
        showNotification("info", "File Data Matches Current Save")
    }
    else {
        showNotification("error", fileError, null, 5);
    }

    document.querySelector("#file-input").value = null;
}

//HALP THIS FUNCTION NEEDS TO BE CLEANED UP WITH A LOT OF THE HEAVY LIFTING NOT HAVING TO BE DONE HERE BECAUSE THE MODAL HAS CHECKS ON SUBMIT
function validateInputFile(fileData) {
    if (fileData === "") {
        return "File is empty"
    }

    const fileDataKeys = Object.keys(fileData);
    const gameKeys = ["score", "settings", "weapons"];

    let numberOfMissingGameKeys = 0;

    for (let i = 0; i < gameKeys.length; i++) {
        const currentGameKey = gameKeys[i];

        if (!fileDataKeys.includes(currentGameKey)) {
            fileData[currentGameKey] = {};
            numberOfMissingGameKeys++;
        }
    }

    if (numberOfMissingGameKeys === gameKeys.length) {
        return `This file does not contain any of the following as base keys: ${gameKeys}`
    }

    //settings validation
    const fileDataSettingsKeys = Object.keys(fileData["settings"]);
    const settingsKeys = Object.keys(settings);

    for (let i = 0; i < settingsKeys.length; i++) {
        const currentSettingsKey = settingsKeys[i];

        if (!fileDataSettingsKeys.includes(currentSettingsKey)) {
            fileData["settings"][currentSettingsKey] = null;
        }
    }

    if (!fileData["settings"]["askBeforeRemove"]) {
        fileData["settings"]["askBeforeRemove"] = true;
    }

    if (typeof fileData["settings"]["askBeforeRemove"] !== "boolean") {
        fileData["settings"]["askBeforeRemove"] = true;
    }

    if (!fileData["settings"]["autoplayInterval"]) {
        fileData["settings"]["autoplayInterval"] = 2000;
    }

    if (typeof fileData["settings"]["autoplayInterval"] !== "number" || fileData.settings["autoplayInterval"] < 0 || fileData.settings["autoplayInterval"] > 10000) {
        fileData["settings"]["autoplayInterval"] = 2000;
    }
    
    if (!fileData["settings"]["shortcuts"]) {
        fileData["settings"]["shortcuts"] = ["?", "a"];
    }

    //shortcuts handled with weapons later
    
    if (!fileData["settings"]["showWarnings"]) {
        fileData["settings"]["showWarnings"] = true;
    }

    if (typeof fileData["settings"]["showWarnings"] !== "boolean") {
        fileData["settings"]["showWarnings"] = true;
    }

    
    //score validation    
    const fileDataScoreKeys = Object.keys(fileData["score"]);
    const scoreKeys = Object.keys(score);
    
    for (let i = 0; i < scoreKeys.length; i++) {
        const currentScoreKey = scoreKeys[i];
        
        if (!fileDataScoreKeys.includes(currentScoreKey)) {
            fileData["score"][currentScoreKey] = 0;
        }
        
        if (typeof fileData["score"][currentScoreKey] !== "number") {
            return `All score values need to be numbers ${currentScoreKey} is not a number`;
        }
        
        if (fileData["score"][currentScoreKey] < 0) {
            return `${fileData["score"][currentScoreKey]} cannot be negative`
        }
    }
    
    //weapon validation and settings shortcuts from weapons
    const fileDataWeapons = Object.keys(fileData["weapons"]);
    
    if (fileDataWeapons.length < 1) {
        return "Weapons must contain at least one entry";
    }
    
    //check duplicate weapon names
    const trackUniqueNames = [];
    //take care of misformatted weapon names
    const weaponsExchange = {};

    for (let i = 0; i < fileDataWeapons.length; i++) {
        const currentWeapon = fileDataWeapons[i];
        
        if (!fileData["weapons"][currentWeapon]["beats"]) {
            fileData["weapons"][currentWeapon]["beats"] = [];
        }
        if(!fileData["weapons"][currentWeapon]["ties"]) {
            fileData["weapons"][currentWeapon]["ties"] = [];
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

    const fileWeaponsShortcuts = ["?", "a"];

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

        //if shorcut exists, is a letter, 1 char, and not already added
        if (fileData["weapons"]["shortcut"] && 
            (fileData["weapons"]["shortcut"].toLowerCase() !== fileData["weapons"]["shortcut"]).toUpperCase() && 
            fileData["weapons"]["shortcut"].length === 1 &&!fileWeaponsShortcuts.includes(fileData["weapons"]["shortcut"])) {
            fileWeaponsShortcuts.push(fileData["weapons"]["shortcut"]);
        }
    });

    fileData["settings"]["shortcuts"] = fileWeaponsShortcuts;

    const weaponConflict = weaponsHaveConflicts(fileData["weapons"]);

    if (weaponConflict) {
        return weaponConflict;
    }
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
    const fileNamePrefix = Object.keys(weapons).map(currentWeaponName => currentWeaponName[0]).join("");

    const a = document.createElement("a");
    const file = new Blob([dataToSave], {type: "application/json"});
    a.href = URL.createObjectURL(file);
    a.download = `${fileNamePrefix}_save_file.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

//ideally UI would not use prompt
function loadPresets() {
    const selectedPreset = prompt("Enter 1, 2 or 3");
    
    const acceptableInputs = ["1","2","3"];

    if (acceptableInputs.includes(selectedPreset)) {
        switch (selectedPreset) {
            case "1":
                modalSettings.shortcuts = ["?","a","r","p","s","w"];

                assignValuesToObject(modalWeapons, {"rock":{"beats":["scissors"],"ties":[],"shortcut":"r","button":{}},"paper":{"beats":["rock","well"],"ties":[],"shortcut":"p","button":{}},"scissors":{"beats":["paper"],"ties":[],"shortcut":"s","button":{}},"well":{"beats":["rock","scissors"],"ties":[],"shortcut":"w","button":{}}});

                break;
            case "2":
                modalSettings.shortcuts = ["?","a","r","p","s","k","l"];

                assignValuesToObject(modalWeapons, {"rock":{"beats":["scissors","lizard"],"ties":[],"shortcut":"r","button":{}},"paper":{"beats":["rock","spock"],"ties":[],"shortcut":"p","button":{}},"scissors":{"beats":["paper","lizard"],"ties":[],"shortcut":"s","button":{}},"spock":{"beats":["rock","scissors"],"ties":[],"shortcut":"k","button":{}},"lizard":{"beats":["paper","spock"],"ties":[],"shortcut":"l","button":{}}});

                break;
            case "3":
                modalSettings.shortcuts = ["?","a","r","p","s","f","w"];

                assignValuesToObject(modalWeapons, {"rock":{"beats":["scissors","water"],"ties":[],"shortcut":"r","button":{}},"paper":{"beats":["rock","water"],"ties":[],"shortcut":"p","button":{}},"scissors":{"beats":["paper","water"],"ties":[],"shortcut":"s","button":{}},"fire":{"beats":["rock","paper","scissors"],"ties":[],"shortcut":"f","button":{}},"water":{"beats":["fire"],"ties":[],"shortcut":"w","button":{}}});

                break;
            default:
                break;
        }

        updateSettingsModal();
    }
}

//ideally would check if there are any form changes. if not then, would not execute
function submitNewSettings() {
    //clear all values from modal weapons
    assignValuesToObject(modalWeapons, {});

    assignValuesToObject(modalSettings, {
        autoplayInterval: Number(document.querySelector("#autoplay-interval").value)*1000,
        shortcuts: ["?", "a"],
        askBeforeRemove: document.querySelector("#ask-before-remove").checked,
        showWarnings: document.querySelector("#show-warnings").checked,
    });

    // if user manually enter unsupported number, limit it. ideally would allow restricted typing
    if (modalSettings["autoplayInterval"] < 0) modalSettings["autoplayInterval"] = 0;
    if (modalSettings["autoplayInterval"] > 10000) modalSettings["autoplayInterval"] = 10000;

    const modalListOfEntries = document.querySelectorAll(".button-entry");

    //load all values into the temporary modal weapons object
    for (let index = 0; index < modalListOfEntries.length; index++) {
        const currentModalEntry = modalListOfEntries[index];

        const currentWeaponName = currentModalEntry.querySelector(`input.js-name-input`).value;
        const currentWeaponShortcut = currentModalEntry.querySelector(`input.js-shortcut-input`).value.toLowerCase();

        modalWeapons[currentWeaponName] = {};

        const currentWeaponsDropdowns = currentModalEntry.querySelectorAll("select");

        if (modalListOfEntries.length > 1) {
            const currentWeaponBeats = Array.from(currentWeaponsDropdowns[0].selectedOptions).map(({ value }) => value);
            const currentWeaponTies = Array.from(currentWeaponsDropdowns[1].selectedOptions).map(({ value }) => value);

            modalWeapons[currentWeaponName]["beats"] = currentWeaponBeats;
            modalWeapons[currentWeaponName]["ties"] = currentWeaponTies;
        }
        else {
            modalWeapons[currentWeaponName]["beats"] = [];
            modalWeapons[currentWeaponName]["ties"] = [];
        }

        if (currentWeaponShortcut) {
            if (modalSettings["shortcuts"].includes(currentWeaponShortcut)) {
                showNotification("error", "This Shortcut Already Exists. Shortcut Will Not be Saved");

                return;
            }
            else if (currentWeaponShortcut.toLowerCase() === currentWeaponShortcut.toUpperCase()) {
                showNotification("error", `Shortcuts must be valid letters. ${currentWeaponName} cannot use "${currentWeaponShortcut}"`);

                return;
            }
            
            modalSettings["shortcuts"].push(currentWeaponShortcut);
            modalWeapons[currentWeaponName]["shortcut"] = currentWeaponShortcut;
        }
    }

    errorMessage = weaponsHaveConflicts(modalWeapons);

    if (!errorMessage) {
        const settingsAreDifferent = !checkIfObjectValuesAreTheSame(weapons, modalWeapons) || !checkIfObjectValuesAreTheSame(settings, modalSettings) || !checkIfObjectValuesAreTheSame(score, modalScore);

        const autoplayIntervalWasChanged = settings.autoplayInterval !== modalSettings.autoplayInterval;

        assignValuesToObject(weapons, modalWeapons);
        assignValuesToObject(settings, modalSettings);
        assignValuesToObject(score, modalScore);

        generateDefaultWeaponsHTML();
        setupWeaponButtonListeners();
        updateScoreboard();
        
        closeSettingsModal();

        localStorage.setItem("score", JSON.stringify(score));
        localStorage.setItem("settings", JSON.stringify(settings));
        localStorage.setItem("weapons", JSON.stringify(weapons));

        if (settingsAreDifferent) {
            showNotification("success", "Settings Succesfully Updated");
        }
        else {
            showNotification ("info", "No Edits Have Been Made");
        }

        //if the interval was changed while autoplaying, update the interval and restart autoplaying
        if (autoplaying && autoplayIntervalWasChanged) {
            autoplayGame();
            autoplayGame();
        }
    }
    else {
        showNotification("error", errorMessage, null, 5);
    }
}

//HALP NOTIFICATION CODE BELOW
//this is to restrict the notifications spamming the screen
const activeNotifications = {};

// https://www.youtube.com/watch?v=wZu4q0FyTOk
function showNotification(messageType, message, buttonElement=null, secondsVisible=3) {
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
