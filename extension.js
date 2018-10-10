// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-gibberwocky" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable1 = vscode.commands.registerCommand('gibberwocky.execute', function () {
        vscode.window.showInformationMessage('Execute - TODO');
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
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;