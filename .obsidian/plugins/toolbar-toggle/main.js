const { Plugin, Notice } = require("obsidian");

const CMD = "editing-toolbar:hide-show-menu";

module.exports = class ToolbarToggle extends Plugin {
    toggle() {
        if (!this.app.commands.commands[CMD]) {
            new Notice("Плагин Editing Toolbar выключен — панели нет");
            return;
        }
        this.app.commands.executeCommandById(CMD);
    }

    async onload() {
        this.addRibbonIcon("align-center", "Скрыть/показать панель форматирования", () => this.toggle());
        this.addCommand({ id: "toggle", name: "Скрыть/показать панель форматирования", callback: () => this.toggle() });
    }
};
