import * as vscode from 'vscode';
// import { readdir } from 'fs';

export class CmMarkerPosition {
    constructor(start:CmPosition, horizontalOffset?: number) {
        this.start = start;
        if (!(horizontalOffset === undefined))
        {
            this.horizontalOffset = horizontalOffset;
        }
    }
    start!: CmPosition;
    horizontalOffset: number | undefined;
}

export class CmPosition {
    constructor(line: number, ch: number){
        this.line = line;
        this.ch = ch;
    }
    line!: number;
    ch!: number;
}

export class CmRange {
    constructor(from: CmPosition, to: CmPosition) {
        this.from = from;
        this.to = to;
    }
    from!: CmPosition;
    to!: CmPosition;
}

export class TextMarkerAdapter {
    constructor(range: CmRange, options?: object) {
        this.range = range;
        this.options = options;
    }
    lines: Array<any> = [];
    type: any;
    range!: CmRange;
    options: any;

    find(): CmRange{
        return this.range;
    }
    clear() : void {
        console.log("Marker clear : TODO");
    }
}

export class CodeMirrorAdapter {

    __state : any;

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
            editBuilder.delete(new vscode.Range(new vscode.Position(from.line, from.ch),
             new vscode.Position(to.line, to.ch)));
        });
        editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(from.line, from.ch), replacement);
        });
    }
    markText(from: CmPosition,
        to: CmPosition, options?: object): TextMarkerAdapter {

        return new TextMarkerAdapter(new CmRange(from,to), options);
    }
}
