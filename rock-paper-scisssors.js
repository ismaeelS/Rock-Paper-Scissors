// import score from localStorage if available or initialize a score starting at 0-0-0
const score = JSON.parse(localStorage.getItem("score")) || {
    wins: 0,
    losses: 0,
    ties: 0,
}

const settings = JSON.parse(localStorage.getItem("settings")) || {
    "autoPlayInterval": 2000,
    "shortcuts": ["backspace", "a", "x"],
}

let autoplaying = false;
let intervalId;

const pageTitle = document.querySelector(".js-page-title");
const resultsParagraph = document.querySelector(".js-results-text");
const winRateParagraph = document.querySelector(".js-win-rate");

const weapons = {
    "rock": {
        "button": null,
        "beats": ["scissors"],
        "shortcut": "r",
        "backgroundImage": "images/rock.jpg",
    },
    "paper": {
        "button": null,
        "beats": ["rock"],
        "shortcut": "p",
        "backgroundImage": "images/paper.jpg",
    },
    "scissors": {
        "button": null,
        "beats": ["paper"],
        "shortcut": "s",
        "backgroundImage": "images/scissors.jpg",
    },
}

initializeDefaultGameState();

// HALP GO THRU THE INITIAL WEAPONS OBJECT AND FROM IT, BUILD UP THE HTML AND THE SETTINGS OBJECT
function initializeDefaultGameState() {
    generateDefaultWeaponsHTML();

    //set up listeners for the settings icon, the autoplay button, and the reset button
    document.querySelector(".js-gear-icon").addEventListener("click", () => {if(!autoplaying) editSettings()});
    document.querySelector(".js-autoplay-btn").addEventListener("click", () => autoplayGame());
    document.querySelector(".js-reset-score-btn").addEventListener("click", () => resetScore());

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
        settings["shortcuts"].push(weapons[weapon]["shortcut"]);
    });

    //add support to playing with the keyboard
    document.addEventListener("keyup", function(event) {
        const keyPressed = event.key.toLowerCase();

        console.log(keyPressed);

        if (keyPressed === "backspace") {
            resetScore();
        }
        else if (keyPressed === "a") {
            autoplayGame();
        }
        else if (autoplaying || !settings["shortcuts"].includes(keyPressed)) {
            ;
        }
        else if (keyPressed === "x") {
            playOneRound(chooseRandomWeapon());
        }
        //if the pressed key is recognized by the settings object as a valid shortcut, play the weapon
        else {
            Object.keys(weapons).forEach(weapon => {
                if (weapons[weapon]["shortcut"] === keyPressed) {
                    playOneRound(weapon);
                }
            });
        }
        
    });

    updateScoreboard();
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
            resetColors(false);

            clearInterval(intervalId);
            autoplaying = false;
        }
    }
}

function playOneRound(selectedPlayerWeapon) {
    const computerWeapon = chooseRandomWeapon()

    let roundResultMessage = "";

    resetColors(true);
    
    if (selectedPlayerWeapon === computerWeapon) {
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

        resetColors(true);

        updateScoreboard();
    }
}

/**
 * 
 * @param {boolean} resetTitleAndButtonBorders
 * for each element, remove the css classes for border/text colors
 */
function resetColors(resetTitleAndButtonBorders) {
    Object.keys(weapons).forEach(weapon => {
        weapons[weapon]["button"].style.backgroundImage = "";
    });

    if (resetTitleAndButtonBorders) {
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
}

// HALP this needs to open up an interactable dialog box
function editSettings() {
    console.log("In settings");
    console.log(settings);

    let settingToEdit = prompt("1 for interval");

    switch (settingToEdit) {
        case "1":
            let newInterval = (Number(prompt("new interval?")));

            if (newInterval > 0 && newInterval < 10) {
                settings.autoPlayInterval = newInterval*1000;
            }
            break;
    
        default:
            break;
    }

    localStorage.setItem("settings", JSON.stringify(settings));
}

function generateDefaultWeaponsHTML() {
    let arsenal = document.querySelector(".js-button-holder");

    let arsenalHTML = arsenal.innerHTML;

    Object.keys(weapons).forEach(weapon => {
        arsenalHTML += `<button class="js-${weapon}-btn move-btn" data-weapon-name="${weapon}">${weapon}</button>`;
    });

    arsenal.innerHTML = arsenalHTML;
}