/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
const yargs = require('yargs');

const googleJavaFormatUrl =
  'https://github.com/google/google-java-format/releases/download/google-java-format-1.7/google-java-format-1.7-all-deps.jar';
const googleJavaFormatPath = path.join(
  os.tmpdir(),
  'google-java-format-all-deps.jar',
);
const javaFilesCommand = 'find ./ReactAndroid -name "*.java"';

function _download(url, downloadPath, resolve, reject, redirectCount) {
  https.get(url, response => {
    switch (response.statusCode) {
      case 302: //Permanent Redirect
        if (redirectCount === 0) {
          throw new Error(
            `Unhandled response code (HTTP${response.statusCode}) while retrieving google-java-format binary from ${url}`,
          );
        }

        _download(
          response.headers.location,
          downloadPath,
          resolve,
          reject,
          redirectCount - 1,
        );
        break;
      case 200: //OK
        const file = fs.createWriteStream(downloadPath);

        response.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
        break;
      default:
        reject(
          `Unhandled response code (HTTP${response.statusCode}) while retrieving google-java-format binary from ${url}`,
        );
    }
  });
}

function download(url, downloadPath) {
  return new Promise((resolve, reject) => {
    _download(url, downloadPath, resolve, reject, 1);
  });
}

function filesWithLintingIssues() {
  const proc = exec(
    `java -jar ${googleJavaFormatPath} --dry-run $(${javaFilesCommand})`,
    {silent: true},
  );

  if (proc.code !== 0) {
    throw new Error(proc.stderr);
  }

  return proc.stdout.split('\n').filter(x => x);
}

function unifiedDiff(file) {
  const lintedProc = exec(
    `java -jar ${googleJavaFormatPath} --set-exit-if-changed ${file}`,
    {silent: true},
  );

  //Exit code 1 indicates lint violations, which is what we're expecting
  if (lintedProc.code !== 1) {
    throw new Error(lintedProc.stderr);
  }

  const diffProc = lintedProc.exec(`diff -U 0 ${file} -`, {silent: true});

  //Exit code 0 if inputs are the same, 1 if different, 2 if trouble.
  if (diffProc.code !== 0 && diffProc.code !== 1) {
    throw new Error(diffProc.stderr);
  }

  return {
    file,
    diff: diffProc.stdout,
  };
}

function extractRangeInformation(range) {
  //eg;
  //  @@ -54 +54,2 @@
  //  @@ -1,3 +1,9 @@

  const regex = /^@@ [-+](\d+,?\d+) [-+](\d+,?\d+) @@$/;
  const match = regex.exec(range);

  if (match) {
    const original = match[1].split(',');
    const updated = match[2].split(',');

    return {
      original: {
        line: parseInt(original[0], 10),
        lineCount: parseInt(original[1], 10) || 1,
      },
      updated: {
        line: parseInt(updated[0], 10),
        lineCount: parseInt(updated[1], 10) || 1,
      },
    };
  }
}

function parseChanges(file, diff) {
  let group = null;
  const groups = [];

  diff.split('\n').forEach(line => {
    const range = extractRangeInformation(line);

    if (range) {
      group = {
        range,
        description: [line],
      };
      groups.push(group);
    } else if (group) {
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

async function main() {
  const {argv} = yargs
    .scriptName('lint-java')
    .usage('Usage: $0 [options]')
    .command(
      '$0',
      'Downloads the google-java-format package and reformats Java source code to comply with Google Java Style.\n\nSee https://github.com/google/google-java-format',
    )
    .option('check', {
      type: 'boolean',
      description:
        'Outputs a list of files with lint violations.\nExit code is set to 1 if there are violations, otherwise 0.\nDoes not reformat lint issues.',
    })
    .option('diff', {
      type: 'boolean',
      description:
        'Outputs a diff of the lint fix changes in json format.\nDoes not reformat lint issues.',
    });

  await download(googleJavaFormatUrl, googleJavaFormatPath);

  if (argv.check) {
    const files = filesWithLintingIssues();

    files.forEach(x => console.log(x));

    process.exit(files.length === 0 ? 0 : 1);

    return;
  }

  if (argv.diff) {
    const suggestions = filesWithLintingIssues()
      .map(unifiedDiff)
      .filter(x => x)
      .map(x => parseChanges(x.file, x.diff))
      .reduce((accumulator, current) => accumulator.concat(current), []);

    console.log(JSON.stringify(suggestions));

    return;
  }

  const proc = exec(
    `java -jar ${googleJavaFormatPath} --set-exit-if-changed --replace $(${javaFilesCommand})`,
  );

  process.exit(proc.code);
}

(async () => {
  await main();
})();
