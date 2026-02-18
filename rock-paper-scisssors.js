// import score from localStorage if available or initialize a score starting at 0-0-0
const score = JSON.parse(localStorage.getItem("score")) || {
    wins: 0,
    losses: 0,
    ties: 0,
}

const settings = JSON.parse(localStorage.getItem("settings")) || {
    "autoPlayInterval": 2000,
    "shortcuts": ["?", "a", "x"],
}

let unsavedWeapons = JSON.parse(JSON.stringify(weapons));
let unsavedSettings = JSON.parse(JSON.stringify(settings));

let autoplaying = false;
let intervalId;
let settingsModalIsOpen = false;

const pageTitle = document.querySelector(".js-page-title");
const resultsParagraph = document.querySelector(".js-results-text");
const winRateParagraph = document.querySelector(".js-win-rate");

const settingsModal = document.querySelector(".modal-container");
const buttonSettingsSection = document.querySelector(".button-settings");

initializeDefaultGameState();


//  HALP find out online the scope of event listeners esp if they are being initialized within a function
function initializeDefaultGameState() {
    generateDefaultWeaponsHTML();

    //set up listeners for the settings, the autoplay button, and the reset button
    document.querySelector(".js-gear-icon").addEventListener("click", () => {if(!autoplaying) openSettingsModal();});
    document.querySelector(".js-close-btn").addEventListener("click", () => closeSettingsModal());
    document.querySelector(".modal-container").addEventListener("click", (e) => {
        if (settingsModalIsOpen && e.target === (document.querySelector(".modal-container")))
        closeSettingsModal();
    });
    // document.querySelector("body").addEventListener("click", (e) => {console.log(e.target); closeSettingsModal()});
    document.querySelector(".js-settings-add-btn").addEventListener("click", () => {if(settingsModalIsOpen) addWeaponToSettings();});
    //HALP IMPLEMENT THE BELOW
    document.querySelector(".js-settings-reset-btn").addEventListener("click", () => {if(settingsModalIsOpen) resetSettingsChanges();});
    document.querySelector(".js-settings-restore-btn").addEventListener("click", () => {if(settingsModalIsOpen) restoreDefaultSettings()});
    document.querySelector(".submit-btn").addEventListener("click", () => {if(settingsModalIsOpen) submitNewSettings()});

    document.querySelector(".js-autoplay-btn").addEventListener("click", () => {if(!settingsModalIsOpen)autoplayGame();});
    document.querySelector(".js-reset-score-btn").addEventListener("click", () => {if(!settingsModalIsOpen)resetScore();});

    //set up event listeners for the random button
    let randomButton = document.querySelector(".js-random-btn");
    randomButton.addEventListener("click", () => {if(!autoplaying) playOneRound(chooseRandomWeapon())});
    randomButton.addEventListener("mouseover", () => {if(!autoplaying)
        randomButton.style.backgroundImage = `url("images/random.jpg")`;
    });
    randomButton.addEventListener("mouseout", () => {randomButton.style.backgroundImage = ``;});

    //set up event listeners for each weapon
    Object.keys(weapons).forEach(weapon => {
        //find the corresponding button and assign it to the weapons object
        const currentWeaponButton = document.querySelector(`.js-${weapon}-btn`);
        weapons[weapon]["button"] = currentWeaponButton;

        //add event listeners to play the weapon and to toggle the weapon background
        currentWeaponButton.addEventListener("click", () => {if(!autoplaying) playOneRound(weapon)});

        currentWeaponButton.addEventListener("mouseover", () => {if(!autoplaying) 
            currentWeaponButton.style.backgroundImage = `url(${weapons[weapon]["backgroundImage"]})`;
        });

        currentWeaponButton.addEventListener("mouseout", () => {
            currentWeaponButton.style.backgroundImage = ``;
        });

        //add the weapon shortcut to the settings object
        if (!settings["shortcuts"].includes(weapons[weapon]["shortcut"]))
            settings["shortcuts"].push(weapons[weapon]["shortcut"]);
    });

    document.addEventListener("keyup", function(event) {
        const keyPressed = event.key.toLowerCase();

        if (!settingsModalIsOpen) {
            if (keyPressed === "?") {
                playOneRound(chooseRandomWeapon());
            }
            else if (keyPressed === "a") {
                autoplayGame();
            }
            else if (autoplaying || !settings["shortcuts"].includes(keyPressed)) {
                ;
            }
            else if (keyPressed === "x") {
                resetScore();
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

    unsavedWeapons = JSON.parse(JSON.stringify(weapons));
    unsavedSettings = JSON.parse(JSON.stringify(settings));

    updateScoreboard();
    updateSettingsForm();
}

/**
 * Update the webelements with the current scores and set the win rate text color to match success this game
 */
function updateScoreboard() {
    document.querySelector(".js-scoreboard").innerHTML =
    `Your record is
    ${score.wins} win${score.wins === 1?"":"s"}, 
    ${score.losses} loss${score.losses === 1?"":"es"}, and 
    ${score.ties} tie${score.ties === 1?"":"s"}`

    const roundsPlayed = score.wins+score.ties+score.losses;
    const winRate = score.wins/roundsPlayed;

    winRateParagraph.innerHTML = (roundsPlayed) ?
    `You have played ${roundsPlayed} round${roundsPlayed === 1?"":"s"} and your win rate is ${(winRate*100).toFixed(2)}%` : "";

    if (!roundsPlayed || winRate === 1/3) {
        winRateParagraph.classList.remove("turn-text-green");
        winRateParagraph.classList.remove("turn-text-red");
    }
    else {
        winRateParagraph.classList.add(`turn-text-${winRate > (1/3) ? "green": "red"}`);
    }
}

/**
 * set up placeholders, etc (unneccessary if using a framework)
 * HALP update this description
 */
function updateSettingsForm() {
    document.querySelector("#autoplay-interval").placeholder = (settings.autoPlayInterval)/1000;
 
    let buttonSettingsSectionHTML = buttonSettingsSection.innerHTML;

    Object.keys(weapons).forEach(weapon => {
        buttonSettingsSectionHTML += 
        `<div data-${weapon}-div>
            <label for="${weapon}-name">Name</label>
            <input type="text" name="${weapon}-name" id="${weapon}-name" class="weapon-name-input" value="${weapon}" required>
            <label for="${weapon}-shortcut">Shortcut</label>
            <input type="text" name="${weapon}-shortcut" id="${weapon}-shortcut" value="${weapons[weapon]["shortcut"]}" maxlength="1" required>
            
            <label for="${weapon}-beats">Beats</label>
            <select name="${weapon}-beats" id="${weapon}-beats" multiple required>
                ${settingsOptionValuesHTML(weapon, "beats")}
            </select>
            
            <label for="${weapon}-ties">Ties</label>
            <select name="${weapon}-ties" id="${weapon}-ties" multiple>
                ${settingsOptionValuesHTML(weapon, "ties")}
            </select>
            <button type="button" data-${weapon}-remove>Remove</button>
        </div>`;
    });

    //HALP handle removing of divs based on which remove clicked

    buttonSettingsSection.innerHTML = buttonSettingsSectionHTML;
}

//HALP HAVE AN INDICATOR THAT CHANGES HAVE BEEN MADE BUT NOT SAVED
function addWeaponToSettings() {
    console.log("adding weapon input");

    let newWeaponName = prompt("Enter the new weapon's name");

    console.log(newWeaponName);

    if (newWeaponName) {
        newWeaponName = newWeaponName.toLowerCase();

        let newWeaponInput = document.createElement("div");

        newWeaponInput.innerHTML = `<label for="${newWeaponName}-name">Name</label>
                <input type="text" name="${newWeaponName}-name" id="${newWeaponName}-name" class="weapon-name-input" value="${newWeaponName}" required>
                <label for="${newWeaponName}-shortcut">Shortcut</label>
                <input type="text" name="${newWeaponName}-shortcut" id="${newWeaponName}-shortcut" value="" maxlength="1" required>
                
                <label for="${newWeaponName}-beats">Beats</label>
                <select name="${newWeaponName}-beats" id="${newWeaponName}-beats" multiple required>
                    <option value="${newWeaponName}">${newWeaponName}</option>
                </select>
                
                <label for="${newWeaponName}-ties">Ties</label>
                <select name="${newWeaponName}-ties" id="${newWeaponName}-ties" multiple>
                    <option value="${newWeaponName}">${newWeaponName}</option>
                </select>
                <button type="button" data-${newWeaponName}-remove>Remove</button>`;

        buttonSettingsSection.append(newWeaponInput);
    }
}

function settingsOptionValuesHTML(chosenWeapon, comparison) {
    let optionValuesHTML = "";

    Object.keys(weapons).forEach(weapon => {
        optionValuesHTML += `<option ${weapons[chosenWeapon][comparison].includes(weapon) ? "selected" : ""} value="${weapon}">${weapon}</option>`
    });

    return optionValuesHTML;
}

// HALP this needs to open up an interactable dialog box
function openSettingsModal() {
    settingsModalIsOpen = true;
    settingsModal.style.visibility = 'visible';

    //save the current settings in case the new settings are not valid
    const savedSettings = JSON.parse(JSON.stringify(settings));

    // go thru the selected options and then set settings

    let rockdropdown = document.querySelector("#rock-beats").selectedOptions;

    var values = Array.from(rockdropdown).map(({ value }) => value);
    console.log(values);




    let weaponsAreValid = checkIfWeaponsAreValid();

    if (weaponsAreValid) {
        localStorage.setItem("settings", JSON.stringify(settings));
        console.log("weapons are fine");
    }
    else {
        console.log("weapons are not fine");
    }
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
        if (confirm("While autoplaying, you will no longer be able to select your moves or access the settings. Do you want to start?")) {
            intervalId = setInterval(() => {
                Object.keys(weapons).forEach(weapon => {
                    weapons[weapon]["button"].style.backgroundImage = "";
                });

                const bothWeapons = playOneRound(chooseRandomWeapon());

                //show the weapon background when it is picked during autoplay 
                bothWeapons.forEach(weapon => {
                    weapons[weapon]["button"].style.backgroundImage = `url(${weapons[weapon]["backgroundImage"]})`;
                });
            }, settings.autoPlayInterval);

        autoplaying = true;
        }
    }
    else {
        if (confirm("Stop autoplaying?")) {
            Object.keys(weapons).forEach(weapon => {
                weapons[weapon]["button"].style.backgroundImage = "";
            });
            
            clearInterval(intervalId);
            autoplaying = false;
        }
    }
}

function playOneRound(selectedPlayerWeapon) {
    if (!settingsModalIsOpen) {
        const computerWeapon = chooseRandomWeapon()

        let roundResultMessage = "";

        resetColors();

        if (weapons[selectedPlayerWeapon]["ties"].includes(computerWeapon)) {
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
}

/**
 * Only activate if score is not 0-0-0 and user confirms the reset
 * Reset the score to 0-0-0, clear the paragraphs of results,
 * clear localStorage, reset the border and text colors, display 0-0-0
 */
function resetScore() {
    if (score.wins + score.losses + score.ties 
        && confirm("Are you sure you want to reset the score?")) {
        
        score.wins = 0;
        score.losses = 0;
        score.ties = 0;

        document.querySelector(".js-round-picks").innerHTML = "";
        document.querySelector(".js-round-result").innerHTML = "";

        localStorage.removeItem("score");

        if (autoplaying && confirm("Also stop autoplaying?")) {
            clearInterval(intervalId);
            autoplaying = false;
        }

        resetColors();

        updateScoreboard();
    }
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

//HALP do some checks to make sure there isnt unsaved data by comparing savedSettings to settings
function closeSettingsModal() {
    settingsModalIsOpen = false;
    settingsModal.style.visibility = 'hidden';
}

function checkIfWeaponsAreValid() {
    for (let i = 0; i < Object.keys(weapons).length; i++) {
        const firstWeapon = Object.keys(weapons)[i];

        for (let j = i; j < Object.keys(weapons).length; j++) {
            const secondWeapon = Object.keys(weapons)[j];

            // return false if a weapon does not tie with itself
            if (firstWeapon === secondWeapon && !weapons[firstWeapon]["ties"].includes(secondWeapon)) {
                console.log("this weapon does not tie itself so the weapons are not valid");
                return false;
            }

            // return false if a pair of weapons beat each other
            if ((weapons[firstWeapon]["beats"].includes(secondWeapon) && weapons[secondWeapon]["beats"].includes(firstWeapon))) {
                console.log("These two weapons beat each other so the weapons are not valid");
                return false;
            }

            // return false if there is no comparison between this pair of weapons
            if (!(weapons[firstWeapon]["beats"].includes(secondWeapon) || 
            weapons[secondWeapon]["beats"].includes(firstWeapon) ||
            weapons[firstWeapon]["ties"].includes(secondWeapon)
            )) {
                return false;
            }
        }

        return true;
    }
}

function resetSettingsChanges() {
    console.log("reset settings changes");
}

function restoreDefaultSettings() {
    console.log("restoring default settings");
}

function resetSettings() {
    settings.autoPlayInterval = 2000;
    settings.shortcuts = ["?", "a", "x"];
}

function submitNewSettings() {
    console.log("submitted new settings");
}

function generateDefaultWeaponsHTML() {
    let arsenal = document.querySelector(".js-button-holder");

    let arsenalHTML = arsenal.innerHTML;

    Object.keys(weapons).forEach(weapon => {
        arsenalHTML += `<button class="js-${weapon}-btn move-btn" data-weapon-name="${weapon}">${weapon}</button>`;
    });

    arsenal.innerHTML = arsenalHTML;
}

// HALP figure out preloading images
function preloadImage(url) {
    let img = new Image();
    console.log(img)
    img.src = url;
}