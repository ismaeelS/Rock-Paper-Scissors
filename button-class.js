class Button {
    name;
    webElement;

    beats = [];
    ties = [];
    shortcut;

    buttonsWithImages = ["random", "rock", "paper", "scissors", "well", "water", "fire", "lizard", "spock", "man", "woman", "gun", "cat", "dog", "time", "beepboop", "m", "w", "uncreative"];

    constructor(name, beats, ties, shortcut) {
        this.name = name;
        this.beats = beats;
        this.ties = ties;
        this.shortcut = shortcut;
    }

    addShortcutToArray(arr) {
        if (Array.isArray(arr) && arr.length) {
            if (!arr.includes(this.shortcut) && this.shortcut) {
                arr.push(this.shortcut);
            }
        }
    }

    #asHTML() {
        return `<button class="js-${this.name}-btn move-btn" data-button-name="${this.name}">${this.name}</button>`;
    }

    addToPage() {
        document.querySelector(".js-button-holder").innerHTML += this.#asHTML();
    }

    saveWebElement() {
        this.webElement = document.querySelector(`.js-${this.name}-btn`);
    }
    
    deleteFromPage() {
        this.webElement.remove();
    }

    //maybe dont need to do random case and can temp hard code random
    //isAutoplaying needs to be a function that returns if isAutoplaying = true
    setUpEventListeners(isAutoplaying, playOneRound, chooseRandomWeapon) {
        this.webElement.addEventListener("click", () => {
            if(!isAutoplaying()) {
                playOneRound((this.name === "random") ? chooseRandomWeapon() : this);
            }
        });

        this.webElement.addEventListener("mouseover", () => {
            if(!isAutoplaying()) this.showBackground();
        });

        this.webElement.addEventListener("mouseout", () => {
            if(!isAutoplaying()) this.hideBackground();
        });
    }

    showBackground() {
        this.webElement.style.backgroundImage = `url("images/${this.buttonsWithImages.includes(this.name) ? this.name : "unknown"}.jpg")`;
    }

    hideBackground() {
        this.webElement.style.backgroundImage = "";
    }

    setBorderGreen() {
        this.webElement.classList.remove("turn-border-red"); //is this needed?
        this.webElement.classList.add("turn-border-green");
    }
    
    setBorderRed() {
        this.webElement.classList.remove("turn-border-green"); //is this needed?
        this.webElement.classList.add("turn-border-red");
    }
    
    clearBorder() {
        this.webElement.classList.remove("turn-border-green");
        this.webElement.classList.remove("turn-border-red");
    }
}