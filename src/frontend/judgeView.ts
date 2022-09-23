import { ProblemClass } from "../classes/problem";
import * as vscode from "vscode";

export const showJudgeView = function (problem: ProblemClass | undefined): void {

    vscode.window.showInformationMessage(problem.name);
    return;
};