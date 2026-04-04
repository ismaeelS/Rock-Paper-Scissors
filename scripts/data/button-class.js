class Button {
    name;
    beats = [];
    ties = [];
    shortcut;

    addShortcutToArray(arr) {
        if (Array.isArray(arr) && arr.length) {
            if (!arr.includes(this.shortcut) && this.shortcut) {
                arr.push(this.shortcut);
            }
        }
    }

    asHTML() {
        return `<button class="js-${this.name}-btn move-btn" data-button-name="${this.name}">${this.name}</button>`;
    }

    
}