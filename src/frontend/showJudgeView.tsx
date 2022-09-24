import { ProblemClass } from "../classes/problem";
import * as vscode from "vscode";
import { platform } from "os";
import { OS, Errors, tle } from "../utils/consts";
import { Utils } from "../utils/utils";
import * as path from 'path';
import fs = require("fs");
import * as React from 'react';
import * as ReactDOM from 'react-dom';




// function test(): string {
//     let document = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;

//     if (!document) {
//         vscode.window.showInformationMessage("No document is opened, please open solution at first!");
//         return 'test';
//     }
//     return document.fileName;

// }

function App() {

    let testcasesNum = "1";
    // var filePath = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document.fileName.toString() : "null";
    // let test = filePath;


    return (

        <>
            <h1></h1>
            <h2>{testcasesNum}</h2>
        </>

    );
}

ReactDOM.render(
    <App />,
    document.getElementById('app')
)