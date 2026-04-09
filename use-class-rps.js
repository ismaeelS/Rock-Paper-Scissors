// import "./button-class.js";
import { defaultWeapons } from "./scripts/data/weapons.js";
// import { defaultSettings } from "./scripts/data/settings.js";

import { assignValuesToObject } from "./scripts/utils/object-helpers.js";
import { linkToNotification, showNotification } from "./scripts/notification.js";
import { linkToModal, isSettingsModalOpen, openSettingsModal, closeSettingsModal, updateSettingsModal, addWeaponToSettings, undoSettingsChanges, restoreDefaultSettings, uploadFile, saveFile, loadPresets, submitNewSettings } from "./use-class-modal.js";
import { weapons } from "./scripts/data/weapons.js";
import { modal } from "./use-class-modal-obj.js";

let autoplaying = false;
let intervalId;

const pageTitle = document.querySelector(".js-page-title");
const resultsParagraph = document.querySelector(".js-results-text");
const winRateParagraph = document.querySelector(".js-win-rate");

let score = {
    wins: 0,
    losses: 0,
    ties: 0,
};

const defaultSettings = {
    autoplayInterval: 2000,
    shortcuts: ["?", "a", "r", "p", "s"],
    askBeforeRemove: true,
    showWarnings: false,
};
let settings = defaultSettings;

//HALP INCORPORATE THE DEFAULT BUTTONS AND BASED BUTTONS OFF THAT
//need to interact with localstorage
const defaultButtons = [new Button("random", null, null, "?"), new Button("rock", ["scissors"], [], "r"), new Button("paper", ["rock"], [], "p"), new Button("scissors", ["paper"], [], "s")];

const buttons = defaultButtons.slice(0, defaultButtons.length); //HALP LOAD FROM LOCALSTORAGE HERE

let modalWeapons = {};
let modalSettings = {};
let modalScore = {};

linkToModal({
    modalWeapons,
    modalSettings,
    modalScore,
    settings,
    weapons,
    score,
    defaultWeapons,
    defaultSettings,
    setUpButtonHTMLAndListeners,
    setUpKeyPressListeners,
    updateButtonHolder,
    updateScoreboard,
});
linkToNotification(modalSettings);

initializeDefaultGameState();

function setUpModalListeners() {
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

    document.querySelector(".js-settings-undo-btn").addEventListener("click", () => {
        if (undoSettingsChanges()) {
            showNotification("success", "Recent Edits Have Been Reversed");
        }
        else {
            showNotification("info", "There are no Unsaved Edits to Undo");
        }
    });
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
    document.querySelector(".js-submit-btn").addEventListener("click", () => {submitNewSettings(autoplaying, autoplayGame);});
}

function setUpAutoPlayAndGameInfoListeners() {
    document.querySelector(".js-autoplay-btn").addEventListener("click", () => {autoplayGame();});
    document.querySelector(".js-autoplay-btn").addEventListener("mouseenter", (e) => {
        if(!autoplaying) {
            showNotification("warning", "While Autoplaying, You Will No Longer Be Able to Select Your Moves");
        }
        else {
            showNotification("info", "Click Autoplay Again to End Autoplay");
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

    document.querySelector(".js-autoplay-btn").style.visibility = "visible";
}

function setUpButtonHTMLAndListeners() {
    buttons.forEach((button) => {
        button.addToPage();

        button.addShortcutToArray(settings.shortcuts);
    });

    buttons.forEach((button) => {
        button.saveWebElement();

        button.setUpEventListeners(isAutoplaying, playOneRound, chooseRandomWeapon);
    });
}

function isAutoplaying() {
    return autoplaying;
}

function setUpKeyPressListeners() {
    document.addEventListener("keyup", function(event) {
        const keyPressed = event.key.toLowerCase();

        // when the modal is open, allow for the following keyboard instructions
        if (isSettingsModalOpen()) {
            if (keyPressed == "escape") {
                closeSettingsModal();
            }
            else if (keyPressed == "enter") {
                submitNewSettings(autoplaying, autoplayGame);
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
            // if the pressed key is recognized by the settings object as a valid shortcut, play the weapon
            else {
                buttons.forEach((button) => {
                    if (button.shortcut === keyPressed) {
                        playOneRound(button);
                    }
                });
            }
        }
    });
}

function initializeModalObjects() {
    buttons.forEach((button) => {
        modalWeapons[button.name] = {};
        modalWeapons[button.name]["beats"] = button.beats;
        modalWeapons[button.name]["ties"] = button.ties;
        modalWeapons[button.name]["shortcut"] = button.shortcut;
    });

    delete modalWeapons["random"];

    assignValuesToObject(modalSettings, settings);

    modal.defaultSettings = defaultSettings;
    modal.autoplayInterval = settings.autoplayInterval;
    modal.askBeforeRemove = settings.askBeforeRemove;
    modal.showWarnings = settings.showWarnings;
    modal.shortcuts = settings.shortcuts;

    modal.defaultButtons = defaultButtons.slice(1, defaultButtons.length);
    modal.buttons = buttons.slice(1, buttons.length);
    modal.modalButtons = buttons.slice(1, buttons.length);
    modal.modalScore = score;
}

function resetColors() {
    ["green", "red"].forEach(color => {
        pageTitle.classList.remove(`turn-text-${color}`);
        resultsParagraph.classList.remove(`turn-text-${color}`);
        winRateParagraph.classList.remove(`turn-text-${color}`);
    });

    buttons.forEach((button) => {
        button.clearBorder();
    });
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

    modalScore = JSON.parse(JSON.stringify(score));
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

function initializeDefaultGameState() {
    setUpModalListeners();

    setUpAutoPlayAndGameInfoListeners();

    setUpButtonHTMLAndListeners();

    setUpKeyPressListeners();

    initializeModalObjects();

    updateScoreboard();
    updateButtonHolder();
    updateSettingsModal();
}

function playOneRound(chosenButton) {
    const computerWeapon = chooseRandomWeapon();

    let roundResultMessage = "";

    resetColors();

    if (chosenButton.name === computerWeapon.name || chosenButton.ties.includes(computerWeapon.name)) {
        roundResultMessage = "You Tie"
        score.ties++;
    }
    else if (chosenButton.beats.includes(computerWeapon.name)) {
        roundResultMessage = "You Win"
        score.wins++;

        pageTitle.classList.add("turn-text-green");
        resultsParagraph.classList.add("turn-text-green");
        chosenButton.setBorderGreen();
    }
    else {
        roundResultMessage = "You Lose"
        score.losses++;

        pageTitle.classList.add("turn-text-red");
        resultsParagraph.classList.add("turn-text-red");
        chosenButton.setBorderRed();
    }

    document.querySelector(".js-round-picks").innerHTML =
        `You played ${chosenButton.name} and the computer played ${computerWeapon.name}`;

    document.querySelector(".js-round-result").innerHTML = roundResultMessage;

    // localStorage.setItem("score", JSON.stringify(score));

    updateScoreboard();

    return [chosenButton, computerWeapon];
}

/**
 * @returns {string} Randomly generates a number and compares it to the index of each weapon to determine a weapon
 */
function chooseRandomWeapon() {
    const chosenWeaponAtRandom = Math.random();

    //ignore the Random button at position buttons[0]
    for (let i = 0; i < buttons.length-1; i++) {
        if (chosenWeaponAtRandom < (i+1)/(buttons.length-1)) {
            return buttons[i+1];
        }
    }
}

function playOneRandomRound() {
    buttons.forEach((button) => {
        button.hideBackground();
    });

    const bothButtons = playOneRound(chooseRandomWeapon());

    //show the button background when it is picked during autoplay
    bothButtons.forEach(button => {
        button.showBackground();
    });
}

function autoplayGame() {
    if (!autoplaying) {
        playOneRandomRound();
        intervalId = setInterval(playOneRandomRound, settings.autoplayInterval);

        document.querySelector(".js-autoplay-btn").classList.add("rotating-border");
        autoplaying = true;
    }
    else {
        buttons.forEach((button) => {
            button.hideBackground();
        });

        clearInterval(intervalId);
        document.querySelector(".js-autoplay-btn").classList.remove("rotating-border");
        autoplaying = false;
    }
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

        // localStorage.removeItem("score");

        resetColors();

        updateScoreboard();

        return true;
    }

    // localStorage.removeItem("score");

    return false;
}