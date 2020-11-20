#!/usr/bin/env node
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {exec} = require('shelljs');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const googleJavaFormatUrl = 'https://github.com/google/google-java-format/releases/download/google-java-format-1.9/google-java-format-1.9-all-deps.jar';
const googleJavaFormatPath = path.join(os.tmpdir(),`google-java-format-all-deps.jar`);

function download(url, downloadPath, callback){
    https.get(url, response => {
        switch (response.statusCode){
            case 302: //Permanent Redirect
                download(response.headers.location, downloadPath, callback);
                break;
            case 200: //OK
                const file = fs.createWriteStream(downloadPath);

                response.pipe(file);

                file.on('finish', () => file.close(() => callback()));
                break;
            default:
                throw new Error(`Unhandled response code (HTTP${response.statusCode}) while retrieving google-java-format binary from ${url}`);
        }
    });
}

function filesWithLintingIssues(){
    const proc = exec(`java -jar ${googleJavaFormatPath} --dry-run $(find ./ReactAndroid -name "*.java")`, {silent: true});
    return proc.stdout.split('\n').filter(x => x);
}

function unifiedDiff(file){
    const lintedProc = exec(`java -jar ${googleJavaFormatPath} --set-exit-if-changed ${file}`, {silent: true});

    if (lintedProc.code === 0){
        throw new Error(lintedProc.stderr);
    }

    const diffProc = lintedProc.exec(`diff -U 0 ${file} -`, {silent: true});

    if (diffProc.code === 0){
        throw new Error(diffProc.stderr);
    }

    return {
        file,
        diff: diffProc.stdout,
    };
}

function extractRangeInformation(range){
    //eg;
    //  @@ -54 +54,2 @@
    //  @@ -1,3 +1,9 @@

    const regex = /^@@ [-+](\d+,?\d+) [-+](\d+,?\d+) @@$/;
    const match = regex.exec(range);

    if (match){
        const original = match[1].split(',');
        const updated = match[2].split(',');

        return {
            original:{
                line: parseInt(original[0], 10),
                lineCount: parseInt(original[1], 10) || 1,
            },
            updated:{
                line: parseInt(updated[0], 10),
                lineCount: parseInt(updated[1], 10) || 1,
            },
        };
    }
}

function parseChanges(file, diff){
    let group = null;
    const groups = [];

    diff
        .split('\n')
        .forEach(line =>{
            const range = extractRangeInformation(line);

            if (range){
                group = {
                    range,
                    description: [line],
                };
                groups.push(group);
            } else if (group){
                group.description.push(line);
            }
        });

    return groups.map(x => ({
        file,
        line: x.range.original.line,
        lineCount: x.range.original.lineCount,
        description: x.description.join('\n'),
    }));
}

download(googleJavaFormatUrl, googleJavaFormatPath, () =>{
    const suggestions = filesWithLintingIssues()
        .map(unifiedDiff)
        .filter(x => x)
        .map(x => parseChanges(x.file, x.diff))
        .reduce((accumulator, current) => accumulator.concat(current), []);

    console.log(JSON.stringify(suggestions));
});

if(true){} //Temporary eslint violation for testing
