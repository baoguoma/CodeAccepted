//@ts-check

'use strict';

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
/**@type {import('webpack').Configuration}*/
const config = {
    target: 'web', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
    //mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

    entry: './src/frontend/showJudgeView.tsx', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
        // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, '..', 'dist'),
        filename: 'frontend.js'
        //libraryTarget: 'window'
    },
    devtool: false,
    externals: {
        "fs": 'require("fs")',
        vscode: 'vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: {
        fallback: {
            os: require.resolve('os-browserify/browser'),
            path: require.resolve("path-browserify")
        },
        // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
        extensions: ['.ts', '.js', '.tsx']
    },
    module: {
        rules: [
            {
                test: /(\.tsx|\.ts)\b/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    // plugins: [
    //     new CopyPlugin({
    //         patterns: [

    //             { from: 'src/frontend/index.html', to: 'index.html' },

    //         ],
    //     }),
    // ]
};
module.exports = config;