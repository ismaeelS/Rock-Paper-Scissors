const pageTitle = document.querySelector(".js-page-title");
const resultsParagraphs = document.querySelector(".js-results-text");

const rockBtn = document.querySelector('.js-rock-btn');
const paperBtn = document.querySelector('.js-paper-btn');
const scissorsBtn = document.querySelector('.js-scissors-btn');
const randomBtn = document.querySelector('.js-random-btn');
const autoplayBtn = document.querySelector('.js-autoplay-btn');
const resetScoreBtn = document.querySelector(".js-reset-score-btn");

rockBtn.addEventListener("click", () => {if(!autoplaying) playGame("rock")});
paperBtn.addEventListener("click", () => {if(!autoplaying) playGame("paper")});
scissorsBtn.addEventListener("click", () => {if(!autoplaying) playGame("scissors")});
randomBtn.addEventListener("click", () => {if(!autoplaying) playGame(chooseMove())});

autoplayBtn.addEventListener("click", () => autoplayGame());
resetScoreBtn.addEventListener("click", () => resetScore());

document.addEventListener("keyup", function(event) {
    const keyPressed = event.key.toLowerCase();

    if (keyPressed === 'r' || keyPressed === 'arrowleft') {
        if(!autoplaying) playGame("rock");
    }
    else if (keyPressed === 'p' || keyPressed === 'arrowup') {
        if(!autoplaying) playGame("paper");
    }
    else if (keyPressed === 's' || keyPressed === 'arrowright') {
        if(!autoplaying) playGame("scissors");
    }
    else if (keyPressed === 'x' || keyPressed === 'arrowdown') {
        if(!autoplaying) playGame(chooseMove());
    }
    else if (keyPressed === 'a') {
        autoplayGame();
    }
    else if (keyPressed === 'backspace') {
        resetScore();
    }
});