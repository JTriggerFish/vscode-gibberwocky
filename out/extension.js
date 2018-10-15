'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var global = require('../gibber/global.js');
const vscode = require("vscode");
const Gibber = require('../gibber/gibber');
const lomTree_1 = require("./lomTree");
const loophole = require('loophole');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log('vscode-Gibberwocky is now active!');
    Gibber.init();
    Gibber.log = (message) => {
        vscode.window.showInformationMessage(message);
    };
    Gibber.Communication.init(Gibber);
    global.shared.Gibber = Gibber;
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let execDisposable = vscode.commands.registerCommand('gibberwocky.execute', function () {
        vscode.window.showInformationMessage('Gibberwocky Execute');
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        let selection = editor.selection;
        let text = editor.document.getText(selection);
        // Display a message box to the user
        vscode.window.showInformationMessage('Selected characters: ' + text.length);
        Gibber.Scheduler.functionsToExecute.push(new loophole.Function(text).bind(Gibber.currentTrack));
    });
    context.subscriptions.push(execDisposable);
    let delayedExecDisposable = vscode.commands.registerCommand('gibberwocky.delayedExecute', function () {
        vscode.window.showInformationMessage('Delayed Execute - TODO');
    });
    context.subscriptions.push(delayedExecDisposable);
    let clearDisposable = vscode.commands.registerCommand('gibberwocky.clear', function () {
        vscode.window.showInformationMessage('Clear - TODO');
        try {
            Gibber.clear();
        }
        catch (e) {
            vscode.window.showErrorMessage(e);
        }
    });
    context.subscriptions.push(clearDisposable);
    const lomTreeProvider = new lomTree_1.default();
    vscode.window.registerTreeDataProvider('lomTree', lomTreeProvider);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map