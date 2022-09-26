import fs = require("fs");
import * as vscode from "vscode";
import * as path from 'path';
import { Utils } from "../utils/utils";
import { OS } from "../utils/consts";
import { platform } from "os";

export function judgeView(context: any, templatePath: string) {

    templatePath = Utils.pathRefine(templatePath, platform() === "win32" ? OS.windows : OS.linuxMac);
    console.log(templatePath);
    if (vscode.window.activeTextEditor) {
        templatePath = vscode.window.activeTextEditor.document.uri.fsPath;
        templatePath = templatePath.replace(/\\/g, '/');
    } else {
        templatePath = decodeURIComponent(templatePath);
        //templatePath = templatePath.replace(/ /g, '_');
    }

    const lastIndexOfSlash: number = templatePath.lastIndexOf("/");
    let problemStatementPath: string = templatePath.slice(0, lastIndexOfSlash + 1);
    problemStatementPath = problemStatementPath + 'statement.html';

    const resourcePath = problemStatementPath;
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
    // html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m: any, $1: any, $2: any) => {
    //     return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    // });
    return html;

}