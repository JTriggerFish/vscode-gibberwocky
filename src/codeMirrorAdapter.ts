import * as vscode from 'vscode';
import { readdir } from 'fs';


class CodeMirrorAdapter {

    getLine(n: number) : string
    {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return ""; // No open text editor
        }
        return editor.document.lineAt(n).text;
    }
    replaceRange(replacement: string, 
        from: { line:number, ch :number}, 
        to: { line:number, ch:number }, origin?: string): void {

        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        editor.edit(editBuilder => {
            editBuilder.replace(new vscode.Range(new vscode.Position(from.line, from.ch),
             new vscode.Position(to.line, to.ch)), replacement);
            });
    }
}

export default CodeMirrorAdapter;