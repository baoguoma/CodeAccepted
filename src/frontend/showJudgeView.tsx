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

    let filePath = __dirname + "\\frontend_file\\filePath.txt";
    filePath= filePath.replace(/\//g, '\\');
    filePath.replace(/\\/g, '/');
    //vscode.window.showInformationMessage(myfilePath);
    //let data = fs.readFileSync(filePath);
    // vscode.window.showInformationMessage(data.toString());

    return (

        <>
            <h1>{filePath}</h1>
            <h1>123</h1>
            <h2>{testcasesNum}</h2>
        </>

    );
}

ReactDOM.render(
    <App />,
    document.getElementById('app')
)