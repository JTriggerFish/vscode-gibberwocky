'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var global = require('../gibber/global.js');
const vscode = require("vscode");
const codeMirrorAdapter_1 = require("./codeMirrorAdapter");
const Gibber = require('../gibber/gibber');
const lomTree_1 = require("./lomTree");
const loophole = require('loophole');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log('vscode-Gibberwocky is now active!');
    global.shared.Gibber = Gibber;
    Gibber.init();
    Gibber.log = (message) => {
        vscode.window.showInformationMessage(message);
    };
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.jso
    let delayedExecDisposable = vscode.commands.registerCommand('gibberwocky.delayedExecute', function () {
        // vscode.window.showInformationMessage('Gibberwocky delayed execute');
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        let selection = editor.selection;
        let position;
        let text = "";
        if (selection.isEmpty || (selection.end.character - selection.start.character) < 2) {
            let line = editor.document.lineAt(selection.active.line);
            text = line.text;
            position = line.range.start;
        }
        else {
            text = editor.document.getText(selection);
            position = selection.anchor;
        }
        const textF = "with(global.shared){\n" + text + "\n}";
        try {
            Gibber.Scheduler.functionsToExecute.push(new loophole.Function(textF).bind(Gibber.currentTrack));
            //Environment.flash( cm, selectedCode.selection )
            const markupFunction = () => {
                Gibber.CodeMarkup.process(text, new codeMirrorAdapter_1.CmMarkerPosition(new codeMirrorAdapter_1.CmPosition(position.line, position.character), position.character), new codeMirrorAdapter_1.CodeMirrorAdapter(), Gibber.currentTrack);
            };
            Gibber.Scheduler.functionsToExecute.push(markupFunction);
        }
        catch (e) {
            vscode.window.showErrorMessage(e.message);
        }
    });
    context.subscriptions.push(delayedExecDisposable);
    let execDisposable = vscode.commands.registerCommand('gibberwocky.execute', function () {
        // vscode.window.showInformationMessage('Gibberwocky execute');
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        let selection = editor.selection;
        let text = editor.document.getText(selection);
        // Display a message box to the user
        //vscode.window.showInformationMessage('Selected : ' + text.length);
        text = "with(global.shared){\n" + text + "\n}";
        try {
            const func = new loophole.Function(text);
            // Environment.flash( cm, selectedCode.selection )
            func();
        }
        catch (e) {
            vscode.window.showErrorMessage(e.message);
        }
    });
    context.subscriptions.push(execDisposable);
    let clearDisposable = vscode.commands.registerCommand('gibberwocky.clear', function () {
        // vscode.window.showInformationMessage('Gibberwocky clear');
        try {
            Gibber.clear();
            Gibber.log('All sequencers stopped.');
        }
        catch (e) {
            vscode.window.showErrorMessage(e.message);
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