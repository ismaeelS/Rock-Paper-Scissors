const score = JSON.parse(localStorage.getItem("score")) || {
    wins: 0,
    losses: 0,
    ties: 0,
}

let autoplaying = false;
let intervalId;

const buttons = {
    "rock":rockBtn,
    "paper":paperBtn,
    "scissors":scissorsBtn
}

updateScoreboard();

/**
 * @returns {string} Randomly chooses a move from rock, paper, or scissors
 */
function chooseMove() {
    const move = Math.random();

    if (move < (1/3)) {
        return "rock";
    }
    else if (move < (2/3)) {
        return "paper"
    }

    return "scissors";
}

/**
 * Load in localStorage data or initialize with 0's
 */
function updateScoreboard() {
    document.querySelector(".js-scoreboard").innerHTML =
    `Your record is
    ${score.wins} win${score.wins === 1?'':'s'}, 
    ${score.losses} loss${score.losses === 1?'':'es'}, and 
    ${score.ties} tie${score.ties === 1?'':'s'}`;
}

function autoplayGame() {
    if (!autoplaying) {
        intervalId = setInterval(() => {
            const bothMoves = playGame(chooseMove());

            //show the move's background when it's picked during autoplay 
            bothMoves.forEach(move => {
                buttons[move].classList.add(`${move}-bg`);
            });
        }, 2000);

        autoplaying = true;
    }
    else {
        if (confirm("Stop autoplaying?")) {
            resetColors(true);

            clearInterval(intervalId);
            autoplaying = false;
        }
    }
}

function playGame(selectedMove) {
    const computerMove = chooseMove()

    let roundResultMessage = "";

    resetColors(false);

    if (selectedMove === computerMove) {
        roundResultMessage = "You Tie"
        score.ties++;
    }
    else if (
        (selectedMove === "rock" && computerMove === "scissors") ||
        (selectedMove === "paper" && computerMove === "rock") ||
        (selectedMove === "scissors" && computerMove === "paper")
    ) {
        roundResultMessage = "You Win"
        score.wins++;
        
        pageTitle.classList.add("turn-text-green");
        resultsParagraphs.classList.add("turn-text-green");
        buttons[selectedMove].classList.add("turn-border-green");
    }
    else {
        roundResultMessage = "You Lose"
        score.losses++;
        
        pageTitle.classList.add("turn-text-red");
        resultsParagraphs.classList.add("turn-text-red");
        buttons[selectedMove].classList.add("turn-border-red");
    }

    document.querySelector(".js-round-picks").innerHTML = 
        `You played ${selectedMove} and the computer played ${computerMove}`;
    
    document.querySelector(".js-round-result").innerHTML = roundResultMessage;

    localStorage.setItem("score", JSON.stringify(score));

    updateScoreboard();

    return [selectedMove, computerMove];
}

/**
 * Only activate if score isn't 0-0-0 and user confirms the reset
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

        resetColors(false);

        updateScoreboard();
    }
}

/**
 * 
 * @param {boolean} onlyRemoveBackground
 * for each element, remove the css classes for border/text colors
 */
function resetColors(onlyRemoveBackground) {
    Object.keys(buttons).forEach(move => {
        buttons[move].classList.remove(`${move}-bg`);
    });

    if (!onlyRemoveBackground) {
        ["green", "red"].forEach(color => {
            pageTitle.classList.remove(`turn-text-${color}`);
            resultsParagraphs.classList.remove(`turn-text-${color}`);
        });

        Object.keys(buttons).forEach(move => {
            ["green", "red"].forEach(color => {
                buttons[move].classList.remove(`turn-border-${color}`);
            });
        });
    }
}