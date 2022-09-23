import { ProblemClass } from "../classes/problem";
import * as vscode from "vscode";
import { platform } from "os";
import { OS, Errors, tle } from "../utils/consts";
import { Utils } from "../utils/utils";
const fs = require("fs");
import React from 'react';

function returnProblemPath(filePath: string): string {
    const os = platform() === "win32" ? OS.windows : OS.linuxMac;
    let path = Utils.pathRefine(filePath, os);
    if (vscode.window.activeTextEditor) {

        path = vscode.window.activeTextEditor.document.uri.fsPath;
        path = path.replace(/\\/g, '/');
    }
    return path;

}

function returnTestFolderPath(filePath: string): string {
    let path: string = returnProblemPath(filePath);

    const lastIndexOfSlash: number = path.lastIndexOf("/");
    const problemFolderPath: string = path.slice(0, lastIndexOfSlash + 1);

    const testsFolderPath = problemFolderPath + "Tests/";
    return testsFolderPath;

}

function returnProblemName(filePath: string): string {

    let path: string = returnProblemPath(filePath);
    const lastIndexOfSlash: number = path.lastIndexOf("/");
    const lastIndexOfPoint: number = path.lastIndexOf('.')

    let problemName: string = path.slice(lastIndexOfSlash + 1, lastIndexOfPoint);
    let arr = problemName.split("_");

    problemName = arr[1] + " " + arr[2];

    return problemName;

}

function countTestcasesNumber(testsFolderPath: string): number {
    let i: number = 1;
    while (true) {
        const inputFilePath: string = `${testsFolderPath}input_${i}.txt`;

        if (fs.existsSync(inputFilePath)) {
            i++;
        } else {
            return i;
        }
    }
}

export function showJudgeView(filePath: string) {

    let problemName = returnProblemName(filePath);
    vscode.window.showInformationMessage(problemName);
    let testsFolderPath = returnTestFolderPath(filePath);
    let testcasesNum = countTestcasesNumber(testsFolderPath);

    return (
        <div className="ui">
            <div className="meta">
                <h1 className="problem-name">
                    <a href={getHref()}>{problem.name}</a>{' '}
                    {compiling && (
                        <b className="compiling" title="Compiling">
                            <span className="loader"></span>
                        </b>
                    )}
                </h1>
            </div>
            <div className="results">{views}</div>
        </div>
    );
};