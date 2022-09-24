import * as vscode from "vscode";
const fs = require("fs");
import { Utils } from "../../utils/utils";
import { compileFile } from "./compile_solution";
import { runTestsWithTimeout } from "./run_solution";
import { platform } from "os";
import { OS, Errors, tle } from "../../utils/consts";

export const runTestCases = async function (filePath: string): Promise<void> {
    //my  code
    let test: string = __dirname + "\\frontend_file";
    test.replace(/\\/g, '/');
    vscode.window.showInformationMessage(test);
    fs.mkdirSync(test);
    //

    // Code for running test cases and returning verdict
    const os = platform() === "win32" ? OS.windows : OS.linuxMac;
    let path = Utils.pathRefine(filePath, os);

    if (vscode.window.activeTextEditor) {
        path = vscode.window.activeTextEditor.document.uri.fsPath;
        path = path.replace(/\\/g, '/');
    }

    //vscode.window.showInformationMessage(path);
    if (!fs.existsSync(path)) {
        vscode.window.showErrorMessage("Problem solution file not found.");
        return;
    }

    const lastIndexOfSlash: number = path.lastIndexOf("/");
    const problemFolderPath: string = path.slice(0, lastIndexOfSlash + 1);

    const testsFolderPath = problemFolderPath + "Tests/";

    if (!fs.existsSync(testsFolderPath)) {
        vscode.window.showErrorMessage("Tests not found. Please add a test case.");
        return;
    }

    try {
        await compileFile(path, testsFolderPath);
    } catch (err) {
        console.log(err);
        return;
    }

    const resultFilePath: string = `${testsFolderPath}result.txt`;

    let i: number = 1;
    let passed: boolean = true;
    tle.tleFlag = false;
    while (true) {
        const inputFilePath: string = `${testsFolderPath}input_${i}.txt`;

        if (!fs.existsSync(inputFilePath)) {
            break;
        }
        const outputFilePath: string = `${testsFolderPath}output_${i}.txt`;
        const codeOutputFilePath: string = `${testsFolderPath}code_output_${i}.txt`;
        const stderrFilePath: string = `${testsFolderPath}stderr_${i}.txt`;

        try {

            let runResult = await runTestsWithTimeout(
                path,
                inputFilePath,
                codeOutputFilePath,
                testsFolderPath,
                stderrFilePath,
                os,
                'a',
                '1'
            );

            let input: string = await readFile(inputFilePath);
            let expectedOutput: string = await readFile(outputFilePath);
            let codeOutput: string = await readFile(codeOutputFilePath);

            let result: string = "";
            let testResult: boolean;
            if (runResult === Errors.timeLimitExceeded || runResult === Errors.runTimeError) {
                result = result + `Test ${i} ${runResult}\n\n`;
                testResult = false;
            }
            else {
                testResult = await compareOutputs(
                    outputFilePath,
                    codeOutputFilePath
                );

                if (testResult === true) {
                    result = result + `Test ${i} Passed\n\n`;
                }
                else {
                    result = result + `Test ${i} Failed\n\n`;
                }
            }

            result = result + `Input ${i}: \n${input}\n\nExpected Output : \n${expectedOutput}\n\nObtained Output : \n${codeOutput}\n\n`;
            if (fs.existsSync(stderrFilePath)) {
                let stderr: string = await readFile(stderrFilePath);
                result = `${result}Standard Error : \n${stderr}\n\n`;
            }

            result = result + "________________________________________________________\n\n";
            fs.appendFileSync(resultFilePath, result, (err: any) => {
                if (err) {
                    vscode.window.showErrorMessage("Could not write result.");
                }
            });

            if (!testResult) {
                vscode.window.showTextDocument(vscode.Uri.file(resultFilePath), {
                    preview: false,
                    viewColumn: vscode.ViewColumn.Beside,
                    preserveFocus: true,
                });
                if (runResult === Errors.timeLimitExceeded || runResult === Errors.runTimeError) {
                    return;
                }
                if (passed === true) {
                    vscode.window.showErrorMessage(
                        `Test ${i} failed`
                    );
                }
                passed = false;
            }
        } catch (err) {
            // Runtime errors also get logged here
            passed = false;
            return;
        }

        i++;
    }

    if (passed === true) {
        const click:
            | string
            | undefined
            = await vscode.window.showInformationMessage(
                `All test cases passed.`,
                "Show Results"
            );
        if (click === "Show Results") {
            vscode.window.showTextDocument(vscode.Uri.file(resultFilePath), {
                preview: false,
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: true,
            });
        }
    }
};

export const compareOutputs = async (
    outputFilePath: string,
    codeOutputFilePath: string
): Promise<boolean> => {
    // Code to compare the expected output and the obtained output

    let expectedOutput: string = await readFile(outputFilePath);

    let obtainedOutput: string = await readFile(codeOutputFilePath);

    expectedOutput = refine(expectedOutput);
    obtainedOutput = refine(obtainedOutput);
    if (expectedOutput === obtainedOutput) {
        return true;
    } else {
        return false;
    }
};

const refine = (content: string): string => {
    content = content.trim();
    content = content.replace(/\r/g, "");
    content = content.replace(/ \n/g, "\n");

    return content;
};

export const readFile = (filePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (error: any, fileContent: string) => {
            if (error !== null) {
                reject(error);
                return;
            }

            resolve(fileContent);
        });
    });
};
