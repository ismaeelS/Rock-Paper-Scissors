export const modal = {
    autoplayInterval: 2000,
    shortcuts: [],
    askBeforeRemove: true,
    showWarnings: false,

    buttons: [],
    defaultButtons: [],

    modalButtons: [],
    modalScore: {},

    displayGeneralValues: function() {
        document.querySelector("#autoplay-interval").value = modal.autoplayInterval/1000;
        document.querySelector("#ask-before-remove").checked = modal.askBeforeRemove;
        document.querySelector("#show-warnings").checked = modal.showWarnings;
    },
    findButtonIndexByName: function(targetName) {
        for (let i = 0; i < this.modalButtons.length; i++) {
            const button = this.modalButtons[i];
            
            if (button.name === targetName) {
                return i;
            }
        }

        return -1;
    },
    setUpRemoveButtonListener: function(removeButton) {
        removeButton.addEventListener("click", () => {
            const currentWeaponName = removeButton.dataset.buttonName;

            const currentButtonIndex = this.findButtonIndexByName(currentWeaponName);
            const currentButton = this.modalButtons[currentButtonIndex];

            if (!this.askBeforeRemove || confirm(`Are you sure you want to remove the ${currentWeaponName} button?`)) {
                const buttonEntry = document.querySelector(`.js-${currentWeaponName}-button-entry`);
    
                //remove the corresponding shortcut
                this.shortcuts = this.shortcuts.filter((shortcut) => {return shortcut !== currentButton.shortcut});
                //remove the button object and all associations to it from other buttons

                for (let i = 0; i < this.modalButtons.length; i++) {
                    if (i === currentButtonIndex) continue;

                    const button = this.modalButtons[i];
                    button.beats = button.beats.filter((buttonNameInBeats) => {return buttonNameInBeats !== currentWeaponName});
                    button.ties = button.ties.filter((buttonNameInTies) => {return buttonNameInTies !== currentWeaponName});
                }

                this.modalButtons.splice(currentButtonIndex, 1);
    
                buttonEntry.remove();
    
                this.populateButtonList();
            }
        });
    },
    populateButtonList: function() {
        let html = "";

        this.modalButtons.forEach(button => {
            html += 
            `<div class="js-${button["name"]}-button-entry button-entry">
            <div class="entry-name-shortcut">
                <div>
                    <label for="${button["name"]}-name">Name</label>
                    <input type="text" name="${button["name"]}-name" id="${button["name"]}-name" class="name-input js-name-input" value="${button["name"]}" maxlength="10" disabled>
                </div>
                <div>
                    <label for="${button["name"]}-shortcut">Shortcut</label>
                    <input type="text" name="${button["name"]}-shortcut" id="${button["name"]}-shortcut" class="js-shortcut-input" value="${(button["shortcut"]) ? button["shortcut"] : ""}" maxlength="1">
                </div>
            </div>

            ${this.modalButtons.length > 1 ?
                `<div class="entry-comparison-remove">
                    <div>
                        <label for="${button["name"]}-beats">Beats:</label>
                        <select name="${button["name"]}-beats" id="${button["name"]}-beats" multiple>
                            ${this.createModalDropdownOptionsHTML(button, "beats")}
                        </select>
                    </div>
                    <div>
                        <label for="${button["name"]}-ties">Ties:</label>
                        <select name="${button["name"]}-ties" id="${button["name"]}-ties" multiple>
                            ${this.createModalDropdownOptionsHTML(button, "ties")}
                        </select>
                    </div>
                    <button type="button" class="js-remove-btn remove-btn" data-button-name="${button.name}">Remove</button>
                </div>` : ""}
        </div>`;
        });

        document.querySelector(".button-settings").innerHTML = html;

        document.querySelectorAll(".js-remove-btn").forEach((removeButton) => {
            this.setUpRemoveButtonListener(removeButton);
        });
    },
    createModalDropdownOptionsHTML: function(chosenButton, comparison) {
        let optionValuesHTML = "";

        this.modalButtons.forEach(button => {
            if (chosenButton.name !== button.name) {
                optionValuesHTML +=
                    `<option
                        ${chosenButton[comparison].includes(button.name)
                        ? "selected" : ""} value="${button.name}">${button.name}
                    </option>`
            }
        });

        return optionValuesHTML;
    },
    formatButtonName: function(attemptedButtonName) {
        if (!attemptedButtonName) return null;
    
        //remove non alphanumeric characters, lowercase, and truncate
        attemptedButtonName = attemptedButtonName.replace(/[^0-9a-z]/ig, "").toLowerCase().substring(0,10);
    
        //if too many w or m
        const numberofMs = (attemptedButtonName.match(new RegExp("m", "g")) || []).length;
        if (numberofMs > 4) attemptedButtonName = "m";
        const numberofWs = (attemptedButtonName.match(new RegExp("w", "g")) || []).length;
        if (numberofWs > 4) attemptedButtonName = "w";
    
        const creativeExceptions = ["m", "w", "x"]
    
        if (attemptedButtonName.length == 1 && !creativeExceptions.includes(attemptedButtonName)) {
            attemptedButtonName = "uncreative";
        }
    
        //if only numbers are given, set the name
        if (!isNaN(attemptedButtonName)) attemptedButtonName = "beepboop";
    
        if (attemptedButtonName === "random") attemptedButtonName = "randomer";
    
        return attemptedButtonName;
    },
    getModalSettings: function() {
        return {
            autoplayInterval: this.autoplayInterval,
            shortcuts: this.shortcuts,
            askBeforeRemove: this.askBeforeRemove,
            showWarnings: this.showWarnings,
        };
    },
    getButtonNames: function() {
        return this.modalButtons.map((button) => {
            return button.name;
        });
    },
    setModalButtons: function(array) {
        this.modalButtons = [];
        array.forEach((element) => this.modalButtons.push(element));
    },
    setModalSettings: function(object) {
        this.autoplayInterval = object.autoplayInterval;
        this.shortcuts = object.shortcuts.slice(0, object.shortcuts.length);
        this.askBeforeRemove = object.askBeforeRemove;
        this.showWarnings = object.showWarnings;
    },

};