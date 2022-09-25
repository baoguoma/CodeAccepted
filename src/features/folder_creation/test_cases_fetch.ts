const cheerio = require('cheerio');
const axios = require('axios');
const fs = require("fs").promises;
import * as vscode from "vscode";
import { ProblemClass } from '../../classes/problem';

function htmlBody(): string {
    return `
    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN">
<html lang="en">

<head>
    <!-- MathJax -->
    <script type="text/x-mathjax-config">
        MathJax.Hub.Config({
            tex2jax: {inlineMath: [['$$$','$$$']], displayMath: [['$$$$$$','$$$$$$']]}
        });
    </script>
    <script type="text/javascript" src="https://assets.codeforces.com/mathjax/MathJax.js?config=TeX-AMS_HTML-full">
    </script>
    <style>
        div[class="header"] {
            text-align: center;
        }

        div[class="property-title"] {
            display: inline;
        }

        div[class="property-title"]::after {
            content: ": ";
            white-space: pre;
        }
    </style>

</head>

<body>
`;

}

const getInputOutput = async (problem: ProblemClass) => {
    try {
        const { data } = await axios.get(
            `https://codeforces.com/contest/${problem.contestID}/problem/${problem.index}`
        );
        const $ = cheerio.load(data);
        const postTitleInput = $('div > div.input > pre');
        const postTitleOutput = $('div > div.output > pre');

        // my code
        const problemStatement = $('div > div.problem-statement');

        let problemText: any = htmlBody();
        problemText += problemStatement.html();
        problemText += '</body></html>'

        //
        let input: string[] = [];
        let output: string[] = [];

        postTitleInput.each((i: Number, element: any) => {
            let testBlock: string = "";

            if (element.children.length > 1) { // there is mutli-test highlighting enabled 
                element.children.forEach((testLine: any) => {
                    testBlock += $(testLine).html() + '\n';
                });;
            }
            else {
                testBlock = $(element).html().replace(/<br>/g, '\n');
            }

            input.push(testBlock);
        });
        postTitleOutput.each((i: Number, element: string) => {
            output.push($(element).html().replace(/<br>/g, '\n'));
        });

        return { input, output, problemText };

    }
    catch (error) {
        throw error;
    }
};


export const fetchTestCases = async (
    problem: ProblemClass,
    folderPath: string
): Promise<void> => {

    const problemFolderPath = folderPath + `Tests/`;

    try {
        await fs.mkdir(problemFolderPath);
        getInputOutput(problem)
            .then((data) => {
                const problemStatementPath = problemFolderPath + `statement.html`;
                fs.writeFile(problemStatementPath, data.problemText, function (err: any, result: any) {
                    if (err) { vscode.window.showErrorMessage(err); }
                });

                for (let i = 0; i < data.input.length; i++) {
                    const problemFilePath = problemFolderPath + `input_${i + 1}.txt`;
                    fs.writeFile(problemFilePath, data.input[i], function (err: any, result: any) {
                        if (err) { vscode.window.showErrorMessage(err); }
                    });
                }
            });

        getInputOutput(problem)
            .then((data) => {
                for (let i = 0; i < data.output.length; i++) {
                    const problemFilePath = problemFolderPath + `output_${i + 1}.txt`;
                    fs.writeFile(problemFilePath, data.output[i], function (err: any, result: any) {
                    });
                }
            });

    }
    catch (err) {
        vscode.window.showErrorMessage('Could not fetch test cases');
    }
};
