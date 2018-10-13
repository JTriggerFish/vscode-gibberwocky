import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class LomTree implements vscode.TreeDataProvider<LomObject> {

	private _onDidChangeTreeData: vscode.EventEmitter<LomObject | undefined> = new vscode.EventEmitter<LomObject | undefined>();
	readonly onDidChangeTreeData: vscode.Event<LomObject | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: LomObject): vscode.TreeItem {
		return element;
	}

	getChildren(element?: LomObject): Thenable<LomObject[]> {
			return Promise.resolve([]);
			//TODO
	}

}

class LomObject extends vscode.TreeItem {

	constructor(
		public readonly name: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(name, collapsibleState);
	}

	get tooltip(): string {
		return `${this.name}`
	}

	// iconPath = {
	// 	light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'dependency.svg'),
	// 	dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'dependency.svg')
	// };

	contextValue = 'lomobject';

}