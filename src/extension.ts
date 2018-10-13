// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import gibber from '../gibber/gibber';
import lomTreeProvider from './lomTree';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-gibberwocky" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable1 = vscode.commands.registerCommand('gibberwocky.execute', function () {
        vscode.window.showInformationMessage('Gibberwocky Execute');
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        let selection = editor.selection;
        let text = editor.document.getText(selection);

        // Display a message box to the user
        vscode.window.showInformationMessage('Selected characters: ' + text.length);
    });

    context.subscriptions.push(disposable1);

    let disposable2 = vscode.commands.registerCommand('gibberwocky.delayedExecute', function () {
        vscode.window.showInformationMessage('Delayed Execute - TODO');
    });

    context.subscriptions.push(disposable2);

    let disposable3 = vscode.commands.registerCommand('gibberwocky.clear', function () {
        vscode.window.showInformationMessage('Clear - TODO');
    });

    context.subscriptions.push(disposable3);
    const lomTreeProvider = new LomTreeProvider();

	vscode.window.registerTreeDataProvider('lomTree', lomTreeProvider);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;