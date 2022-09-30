import * as vscode from "vscode";
import * as path from 'path';
import fs = require('fs');
import { ContestsProvider } from "./data_providers/contests/contest_data_provider";
import { ContestTreeItem } from "./data_providers/contests/contest_tree_item";
import { ProblemTreeItem } from "./data_providers/problems/problem_tree_item";
import { ProblemsProvider } from "./data_providers/problems/problem_data_provider";
import { copyContestURL } from "./features/copy_url/copy_contest_url";
import { copyProblemURL } from "./features/copy_url/copy_problem_url";
import { createContestDirectory } from "./features/folder_creation/contest_folder_creation";
import { createProblemDirectory } from "./features/folder_creation/problem_folder_creation";
import { runTestCases } from "./features/run_test_cases/run_test_cases";
import { addTestCases } from "./features/run_test_cases/add_test_cases";
import { submitProblem } from "./features/submit_problem/submit_problem";
import { openProblemStatement } from "./features/open_problem_statement/open_problem_statement";
import { openProblemURL } from "./features/open_problem_statement/open_problem_from_problem_list";
import { openContest } from "./features/open_problem_statement/open_contest";
import {
    CodepalConfig,
    codepalConfigName,
    stressTestingFlag,
    Command,
    TreeViewIDs,
    extensionPaths,
    OS
} from "./utils/consts";
import { ProfileProvider } from "./data_providers/user_profile/profile_data_provider";
import { problemsFilterInput } from "./features/problems_list/problems_filter_input";
import { createStressTestingFiles } from "./features/stress_test/createStressTestingFiles";
import { stressTest } from "./features/stress_test/stress_test";
import { contestRegistration } from "./features/contest_registration/contest_registration";
import { manualProblemFolderCreation } from "./features/folder_creation/manual_problem_folder";
import { manualContestFolderCreation } from "./features/folder_creation/manual_contest_folder";
import { openAclDocumentation } from "./features/ACL/openAclDocumentation";
import { createAclCombinedFile } from "./features/ACL/createAclCombinedFile";
import { platform } from "os";

//my import
import { judgeView } from "./frontend/judgeView";
import { newSubmitProblem } from "./submit/submit";
// import { test } from "./submit/test"
//
//my function
function getAllDirbyFilename(dir: string, filename: string) {
    let dirPath = dir;
    let files = fs.readdirSync(dirPath); // 该文件夹下的所有文件名称 (文件夹 + 文件)
    let resultArr: string[] = [];

    files.forEach(file => {
        let filePath = dir + '/' + file; // 当前文件 | 文件夹的路径

        // 满足查询条件文件
        if (file === filename) {
            return resultArr.push(filePath);
        }

        // 继续深搜文件夹
        if (fs.statSync(filePath).isDirectory()) {
            resultArr.push(...getAllDirbyFilename(filePath, filename));
        }

    })

    return resultArr;
}

function returnWebview(param: any) {

}
//

function initExtensionPaths() {
    let extensionPath: string | undefined = vscode.extensions.getExtension('IEEE-NITK.codepal')?.extensionUri.path;

    //TODO: maybe take this from the user through setttings. They might have their own edited atcoder library version
    if (extensionPath !== undefined) {
        const os = platform() === "win32" ? OS.windows : OS.linuxMac;

        if (os === OS.windows) {
            // In windows there is an extra '/' in the beginning that causes problems
            extensionPath = extensionPath.slice(1);
        }
        extensionPaths.path = extensionPath;
        extensionPaths.expanderPyPath = extensionPath + '/res/library/expander.py';
        extensionPaths.libraryPath = extensionPath + '/res/library';
    }
    else {
        vscode.window.showErrorMessage('Unable to get path of Codepal extension');
    }
};
export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "codepal" is now active!');
    let disposable: vscode.Disposable[];
    const rootPath = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath + "/"
        : "/";

    initExtensionPaths();
    let aclSupportEnabled: boolean = vscode.workspace
        .getConfiguration(codepalConfigName)
        .get<boolean>(CodepalConfig.enableAclSupport, false);

    const problemProvider = new ProblemsProvider(rootPath);
    const contestsProvider = new ContestsProvider(rootPath);
    const profileProvider = new ProfileProvider(rootPath);
    vscode.workspace.onDidChangeConfiguration((event) => {
        if (
            event.affectsConfiguration(
                codepalConfigName + "." + CodepalConfig.codeforcesHandle
            )
        ) {
            profileProvider.refresh();
        }
    });
    disposable = [
        vscode.commands.registerCommand(Command.helloWorld, () => {
            vscode.window.showInformationMessage(
                "Namaste World from IEEE/CodePal!"
            );
        }),
    ];
    disposable.push(
        vscode.commands.registerCommand(Command.getProblemFilters, () =>
            problemsFilterInput(problemProvider)
        ) // takes input for toRating, FromRatings and selected tags and then refreshes problem list with given filter
    );
    disposable.push(
        vscode.commands.registerCommand(Command.reloadProblems, () => {
            problemProvider.reload();
        })
    );
    disposable.push(
        vscode.commands.registerCommand(Command.reloadContests, () => {
            contestsProvider.reload();
        })
    );
    disposable.push(
        vscode.commands.registerCommand(
            Command.copyContestURL,
            (param: ContestTreeItem) =>
                copyContestURL(param.contest)
        )
    );
    disposable.push(
        vscode.commands.registerCommand(
            Command.openContest,
            (param: ContestTreeItem) =>
                openContest(param.contest)
        )
    );
    disposable.push(
        vscode.commands.registerCommand(
            Command.createContestDirectory,
            (param: ContestTreeItem) =>
                createContestDirectory(param.contest, rootPath)
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.registerContest,
            async (param: ContestTreeItem) => {
                await contestRegistration(param.contest);
            }
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.copyProblemURL,
            (param: ProblemTreeItem) =>
                copyProblemURL(param.problem)
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.openProblemURL,
            (param: ProblemTreeItem) => {
                openProblemURL(param.problem);
                const options = {
                    enableScripts: true
                }
                const panel = vscode.window.createWebviewPanel(
                    'catCoding', // 只供内部使用，这个webview的标识
                    'Problem Statement', // 给用户显示的面板标题
                    vscode.ViewColumn.Two, // 给新的webview面板一个编辑器视图
                    {
                        enableScripts: true, // 启用JS，默认禁用
                        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
                    } // Webview选项。我们稍后会用上
                );


                if (param.problem != undefined) {

                    let problemName: string = param.problem.name;

                    // let contestPathArray = getAllDirbyFilename(rootPath.replace(/\\/g, '/'), param.problem.index + '_' + problemName);

                    // let contestPath = contestPathArray[0].replace(/\/\//g, '/');

                    const problemFolderPath = 'file:/' + rootPath.replace(/\\/g, '/') + `${param.problem.index}_${problemName}/`;

                    panel.webview.html = judgeView(context, encodeURIComponent(problemFolderPath));
                }
            }
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.createProblemDirectory,
            (param: ProblemTreeItem) => {

                createProblemDirectory(param.problem, rootPath);
            }

        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.manualProblemFolderCreation,
            () => manualProblemFolderCreation(rootPath)
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.manualContestFolderCreation,
            () => manualContestFolderCreation(rootPath)
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.createContestProblemDirectory,
            (param: ContestTreeItem) =>
                createProblemDirectory(param.problem, rootPath)
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.openContestProblem,
            (param: ContestTreeItem) => {
                //openProblemURL(param.problem);


                const options = {
                    enableScripts: true
                }
                const panel = vscode.window.createWebviewPanel(
                    'catCoding', // 只供内部使用，这个webview的标识
                    'Problem Statement', // 给用户显示的面板标题
                    vscode.ViewColumn.Two, // 给新的webview面板一个编辑器视图
                    {
                        enableScripts: true, // 启用JS，默认禁用
                        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
                    } // Webview选项。我们稍后会用上
                );


                if (param.problem != undefined) {

                    let problemName: string = param.problem.name;

                    let contestPathArray = getAllDirbyFilename(rootPath.replace(/\\/g, '/'), param.problem.index + '_' + problemName.replace(/ /g, '_'));
                    let contestPath = contestPathArray[0].replace(/\/\//g, '/');
                    try {
                        if (fs.existsSync(contestPath)) {
                            //file exists
                            const problemFolderPath = 'file:/' + contestPath + '/';// + `${param.problem.index}_${problemName}/`;

                            panel.webview.html = judgeView(context, encodeURIComponent(problemFolderPath));
                        }
                    } catch (err) {
                        vscode.window.showErrorMessage("Could not open problem statment, please create problem/contest folder at first");
                    }
                }

            }

        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.copyContestProblemURL,
            (param: ContestTreeItem) =>
                copyProblemURL(param.problem)
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.runTestCases, (param: any) => {
                runTestCases(String(param));

            }

        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.openProblemStatement,
            (param: any) => {
                //openProblemStatement(String(param))
                //my code

                const options = {
                    enableScripts: true
                }
                const panel = vscode.window.createWebviewPanel(
                    'catCoding', // 只供内部使用，这个webview的标识
                    'Problem Statement', // 给用户显示的面板标题
                    vscode.ViewColumn.Two, // 给新的webview面板一个编辑器视图
                    {
                        enableScripts: true, // 启用JS，默认禁用
                        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
                    } // Webview选项。我们稍后会用上
                );


                panel.webview.html = judgeView(context, String(param));


            }




        )
    );
    disposable.push(
        vscode.commands.registerCommand(
            Command.submitProblem,
            async (param: any) => {
                //await submitProblem(String(param));
                newSubmitProblem(String(param), context);
                // await test();
            }
        )
    );

    disposable.push(
        vscode.commands.registerCommand(Command.addTestCases, (param: any) =>
            addTestCases(String(param))
        )
    );

    disposable.push(
        vscode.window.registerTreeDataProvider(
            TreeViewIDs.contests,
            contestsProvider
        )
    );
    disposable.push(
        vscode.window.registerTreeDataProvider(
            TreeViewIDs.problems,
            problemProvider
        )
    );
    disposable.push(
        vscode.window.registerTreeDataProvider(
            TreeViewIDs.profile,
            profileProvider
        )
    );
    vscode.commands.registerCommand(
        Command.createStressTestingFiles,
        (param: any) => createStressTestingFiles(param)
    );

    disposable.push(
        vscode.commands.registerCommand(Command.stressTest, (param: any) =>
            stressTest(param)
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.stopStressTesting,
            (param: any) => {
                stressTestingFlag.stop = true;
            }
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.openAclDocumentation,
            (param: any) => openAclDocumentation()
        )
    );

    disposable.push(
        vscode.commands.registerCommand(
            Command.creatAclCombinedFile,
            (param: any) => createAclCombinedFile(param)
        )
    );

    context.subscriptions.push(...disposable);
}
export function deactivate() { }
