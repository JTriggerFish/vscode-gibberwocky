"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class LomTree {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        return Promise.resolve([]);
        //TODO
    }
}
exports.default = LomTree;
class LomObject extends vscode.TreeItem {
    constructor(name, collapsibleState, command) {
        super(name, collapsibleState);
        this.name = name;
        this.collapsibleState = collapsibleState;
        this.command = command;
        // iconPath = {
        // 	light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'dependency.svg'),
        // 	dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'dependency.svg')
        // };
        this.contextValue = 'lomobject';
    }
    get tooltip() {
        return `${this.name}`;
    }
}
//# sourceMappingURL=lomTree.js.map