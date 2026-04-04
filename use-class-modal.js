let score;
let settings;
let weapons;
let modalScore;
let modalSettings;
let modalWeapons;
let defaultSettings;
let defaultWeapons;
let updateScoreboard;
let updateButtonHolder;
let generateDefaultWeaponsHTML;
let setupWeaponButtonListeners;
let settingsModalIsOpen = false;

export function updateSettingsModal() {
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

