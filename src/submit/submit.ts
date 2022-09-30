import * as vscode from "vscode";
import { platform } from "os";
import * as fs from "fs";
import { Utils } from "../utils/utils";
import { OS } from "../utils/consts";
import { Context } from "mocha";
const client = require("./client");
const userLoginHandler = require("./userLoginHandler");
const httpSubmitStatus = require("./httpSubmitStatus");
const socket = require("./websocket");
const pref = require("./preferences");

const HOST = pref.getHostName();
const LOGIN_URL = `${HOST}/enter`;
const HOME_PAGE = HOST;

export const newSubmitProblem = async (path: string, context: any) => {
    // showing progress
    const problem = {
        contestId: "",
        problemIndex: "",
        langId: "",
        source: "",
        submitUrl: "",
    };
    // progress.report({
    //     increment: 10,
    //     message: "Saving Code...",
    // });
    vscode.window.showInformationMessage("Submitting Code...")
    try {
        path = Utils.pathRefine(path, platform() === "win32" ? OS.windows : OS.linuxMac);

        if (vscode.window.activeTextEditor) {
            path = vscode.window.activeTextEditor.document.uri.fsPath;
            path = path.replace(/\\/g, '/');
        }
        // ************ copying code to the clipboard **********************
        const code = fs.readFileSync(path).toString();
        vscode.env.clipboard.writeText(code);
        //******************************************************************
        const jsonPath = path.substr(0, path.lastIndexOf("/")) + `/.problem.json`;
        const jsonData = JSON.parse(fs.readFileSync(jsonPath).toString());
        // vscode.env.openExternal(vscode.Uri.parse(`https://codeforces.com/contest/${jsonData.contestID}/submit/${jsonData.index}`, true));
        // vscode.window.showInformationMessage("Submit problem page opened");

        //const filePath =
        //fileManager.utils.getProblemFilePath(problemData);
        // const doc = await vscode.workspace.openTextDocument(filePath);
        problem.source = code;
        // doc.save();
        // progress.report({
        //     increment: 10,
        //     message: "Code Saved..",
        // });

        problem.contestId = jsonData.contestID;
        problem.problemIndex = jsonData.index;

        let lastIndex = path.lastIndexOf(".");
        let fileType = path.slice(lastIndex + 1, path.length);
        console.log(fileType);
        // see compile.js for more detail
        if (fileType === `cpp`) {
            problem.langId = `54`;
        } else if (fileType == `py`) {
            problem.langId = `41`;
        } else if (fileType == `java`) {
            problem.langId = `60`;
        }
        // problem.langId = problemData.langId;
        problem.submitUrl = `https://codeforces.com/contest/${jsonData.contestID}/submit/${jsonData.index}`;

        // Submitting problem
        const sleep = () => new Promise((resolve) => setTimeout(resolve, 7000));
        let success;
        try {
            success = await Submit(context, problem);
        } catch (err) {
            console.log(err);
            // progress.report({
            //     increment: 100,
            //     message: err.message,
            // });
            vscode.window.showErrorMessage(err.message.toString());
            await sleep();
            return false;
        }
        await sleep();
        return success;
    } catch (err) {
        vscode.window.showErrorMessage(err.message.toString());
    }

};

const Submit = async (context: any, problem: any) => {
    let statusPromise, resultPromise;
    // progressHandler.report({
    //     increment: 10,
    //     message: "Loading Cookies...",
    // });

    vscode.window.showInformationMessage("Loading Cookies...");

    client.loadCookies(context);
    const auth = await client.loadAuth(context);
    // setting progress handler to sockets
    // socket.setProgressHandler(progressHandler);
    // refreshing csrf token and getting channels
    // progressHandler.report({
    //     increment: 10,
    //     message: "Getting CSRF token...",
    // });
    //vscode.window.showInformationMessage("Getting CSRF token...");
    let data = await client.getChannelsAndCsrf(problem.submitUrl);
    console.log(data);
    try {
        // resultPromise = socket.connectResultSocket(data.channels);
        statusPromise = _submit(auth, context, data, problem);

        await statusPromise;

        socket.closeSockets();
        return true;
    } catch (err) {
        socket.closeSockets();
        throw err;
    }
};

const _submit = async (auth: any, context: any, data: { csrf_token: any; }, problem: { submitUrl: any; }) => {
    //========================TRY-SUBMIT================================//

    let res = await attemptSubmit(
        { ...auth, csrf_token: data.csrf_token },
        problem
    );

    // =======================LOGIN-IF-FAILED============================//
    // todo: check if csrf token need to be refreshed
    console.log(res.config.url, problem.submitUrl);
    if (res.config.url == LOGIN_URL || res.config.url == HOME_PAGE) {
        await login(auth, context);
        // progressHandler.report({
        //     increment: 10,
        //     message: "Getting CSRF token...",
        // });
        data = await client.getChannelsAndCsrf(problem.submitUrl);
        res = await attemptSubmit(
            { ...auth, csrf_token: data.csrf_token },
            problem
        );
    }

    // =============================AFTER-SUBMIT==================================//
    const subId = afterSubmit(res);

    // const statusPromise = socket.connectStatusSocket(data.s_channels, subId);
    const httpStatusPromise = httpSubmitStatus.getUpdate(
        subId
    );

    await httpStatusPromise;
};

const attemptSubmit = async (auth: any, problem: { submitUrl: any; }) => {
    // progressHandler.report({
    //     increment: 10,
    //     message: "Submitting to Codeforces...",
    // });

    vscode.window.showInformationMessage("Submitting to Codeforces...");
    let [res, success] = await client.submit(problem, auth);
    if (!success) {
        // progressHandler.report({
        //     increment: 100,
        //     message: res.message,
        // });
        console.log("Submit Failed due to Network issue", res);
        vscode.window.showErrorMessage("Submit Failed due to Network issue");
        throw new Error("Submit Failed due to Network issue");
    }

    return res;
};

const afterSubmit = (res: any) => {
    // checking for submission submission
    const [submitErrText, isSubmitErr] = client.isSubmitError(res);
    if (isSubmitErr) {
        //closeConnection();
        // progressHandler.report({
        //     increment: 100,
        //     message: submitErrText,
        // });
        vscode.window.showErrorMessage(submitErrText);
        throw new Error(submitErrText);
    }
    //vscode.window.showErrorMessage(submitErrText);
    const submissionId = client.getSubmissionId(res);
    console.log(`Submission Id =>> ${submissionId}`);

    return submissionId;
};

const login = async (auth: any, context: any) => {
    // progressHandler.report({
    //     message: "Getting Credentials..",
    // });

    vscode.window.showInformationMessage("Getting Credentials..");
    const credentials = await userLoginHandler.getCredentials(context);

    // progressHandler.report({
    //     message: "Logging in Codeforces...",
    // });
    console.log("wating logging in");
    let [res, success] = await client.login(credentials, auth);
    console.log("got result", success);
    if (!success) {
        throw new Error("Login Failed, Check Your Internet connection");
    }

    // checking if login succes
    const [loginErrText, isLoginErr] = client.isLoginError(res);
    console.log("got result", success);

    if (isLoginErr) {
        console.log(loginErrText);
        throw new Error(`${loginErrText} (use "Update Login Details" command)`);
    }

    // progressHandler.report({
    //     message: "Login Successful...",
    // });
    vscode.window.showInformationMessage("Login Successful...");
};

