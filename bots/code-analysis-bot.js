/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

if (!process.env.GITHUB_OWNER) {
  console.error('Missing GITHUB_OWNER. Example: facebook');
  process.exit(1);
}
if (!process.env.GITHUB_REPO) {
  console.error('Missing GITHUB_REPO. Example: react-native');
  process.exit(1);
}

const path = require('path');

function push(arr, key, value) {
  if (!arr[key]) {
    arr[key] = [];
  }
  arr[key].push(value);
}

const converterSummary = {
  eslint:
    '`eslint` found some issues. Run `yarn lint --fix` to automatically fix problems.',
  flow: '`flow` found some issues. Run `yarn flow check` to analyze your code and address any errors.',
  shellcheck:
    '`shellcheck` found some issues. Run `yarn shellcheck` to analyze shell scripts.',
  'google-java-format':
    '`google-java-format` found some issues. See https://github.com/google/google-java-format',
};

/**
 * There is unfortunately no standard format to report an error, so we have
 * to write a specific converter for each tool we want to support.
 *
 * Those functions take a json object as input and fill the output with the
 * following format:
 *
 * { [ path: string ]: Array< { message: string, line: number }> }
 *
 * This is an object where the keys are the path of the files and values
 * is an array of objects of the shape message and line.
 */
const converters = {
  raw: function (output, input) {
    for (let key in input) {
      input[key].forEach(function (message) {
        push(output, key, message);
      });
    }
  },

  'google-java-format': function (output, input) {
    if (!input) {
      return;
    }

    input.forEach(function (change) {
      push(output, change.file, {
        message: `\`google-java-format\` suggested changes:
\`\`\`diff
${change.description}
\`\`\`
`,
        line: change.line,
        converter: 'google-java-format',
      });
    });
  },

  flow: function (output, input) {
    if (!input || !input.errors) {
      return;
    }

    input.errors.forEach(function (error) {
      push(output, error.message[0].path, {
        message: error.message.map(message => message.descr).join(' '),
        line: error.message[0].line,
        converter: 'flow',
      });
    });
  },

  eslint: function (output, input) {
    if (!input) {
      return;
    }

    input.forEach(function (file) {
      file.messages.forEach(function (message) {
        push(output, file.filePath, {
          message: message.ruleId + ': ' + message.message,
          line: message.line,
          converter: 'eslint',
        });
      });
    });
  },

  shellcheck: function (output, input) {
    if (!input) {
      return;
    }

    input.forEach(function (report) {
      push(output, report.file, {
        message:
          '**[SC' +
          report.code +
          '](https://github.com/koalaman/shellcheck/wiki/SC' +
          report.code +
          '):** (' +
          report.level +
          ') ' +
          report.message,
        line: report.line,
        endLine: report.endLine,
        column: report.column,
        endColumn: report.endColumn,
        converter: 'shellcheck',
      });
    });
  },
};

/**
 * Sadly we can't just give the line number to github, we have to give the
 * line number relative to the patch file which is super annoying. This
 * little function builds a map of line number in the file to line number
 * in the patch file
 */
function getLineMapFromPatch(patchString) {
  let diffLineIndex = 0;
  let fileLineIndex = 0;
  let lineMap = {};

  patchString.split('\n').forEach(line => {
    if (line.match(/^@@/)) {
      fileLineIndex = line.match(/\+([0-9]+)/)[1] - 1;
      return;
    }

    diffLineIndex++;
    if (line[0] !== '-') {
      fileLineIndex++;
      if (line[0] === '+') {
        lineMap[fileLineIndex] = diffLineIndex;
      }
    }
  });

  return lineMap;
}

async function sendReview(
  octokit,
  owner,
  repo,
  pull_number,
  commit_id,
  body,
  comments,
) {
  if (process.env.GITHUB_TOKEN) {
    if (comments.length === 0) {
      // Do not leave an empty review.
      return;
    } else if (comments.length > 5) {
      // Avoid noisy reviews and rely solely on the body of the review.
      comments = [];
    }

    const event = 'REQUEST_CHANGES';

    const opts = {
      owner,
      repo,
      pull_number,
      commit_id,
      body,
      event,
      comments,
    };

    await octokit.pulls.createReview(opts);
  } else {
    if (comments.length === 0) {
      console.log('No issues found.');
      return;
    }

    if (process.env.CIRCLE_CI) {
      console.error(
        'Code analysis found issues, but the review cannot be posted to GitHub without an access token.',
      );
      process.exit(1);
    }

    let results = body + '\n';
    comments.forEach(comment => {
      results +=
        comment.path + ':' + comment.position + ': ' + comment.body + '\n';
    });
    console.log(results);
  }
}

async function main(messages, owner, repo, pull_number) {
  // No message, we don't need to do anything :)
  if (Object.keys(messages).length === 0) {
    return;
  }

  if (!process.env.GITHUB_TOKEN) {
    console.log(
      'Missing GITHUB_TOKEN. Example: 5fd88b964fa214c4be2b144dc5af5d486a2f8c1e. Review feedback with code analysis results will not be provided on GitHub without a valid token.',
    );
  }

  // https://octokit.github.io/rest.js/
  const {Octokit} = require('@octokit/rest');
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    userAgent: 'react-native-code-analysis-bot',
  });

  const opts = {
    owner,
    repo,
    pull_number,
  };

  const {data: pull} = await octokit.pulls.get(opts);
  const {data: files} = await octokit.pulls.listFiles(opts);

  const comments = [];
  const convertersUsed = [];

  files
    .filter(file => messages[file.filename])
    .forEach(file => {
      // github api sometimes does not return a patch on large commits
      if (!file.patch) {
        return;
      }
      const lineMap = getLineMapFromPatch(file.patch);
      messages[file.filename].forEach(message => {
        if (lineMap[message.line]) {
          const comment = {
            path: file.filename,
            position: lineMap[message.line],
            body: message.message,
          };
          convertersUsed.push(message.converter);
          comments.push(comment);
        }
      }); // forEach
    }); // filter

  let body = '**Code analysis results:**\n\n';
  const uniqueconvertersUsed = [...new Set(convertersUsed)];
  uniqueconvertersUsed.forEach(converter => {
    body += '* ' + converterSummary[converter] + '\n';
  });

  await sendReview(
    octokit,
    owner,
    repo,
    pull_number,
    pull.head.sha,
    body,
    comments,
  );
}

let content = '';
process.stdin.resume();
process.stdin.on('data', function (buf) {
  content += buf.toString();
});
process.stdin.on('end', function () {
  let messages = {};

  // Since we send a few http requests to setup the process, we don't want
  // to run this file one time per code analysis tool. Instead, we write all
  // the results in the same stdin stream.
  // The format of this stream is
  //
  //   name-of-the-converter
  //   {"json":"payload"}
  //   name-of-the-other-converter
  //   {"other": ["json", "payload"]}
  //
  // In order to generate such stream, here is a sample bash command:
  //
  //   cat <(echo eslint; npm run lint --silent -- --format=json; echo flow; flow --json) | node code-analysis-bot.js

  const lines = content.trim().split('\n');
  for (let i = 0; i < Math.ceil(lines.length / 2); ++i) {
    const converter = converters[lines[i * 2]];
    if (!converter) {
      throw new Error('Unknown converter ' + lines[i * 2]);
    }
    let json;
    try {
      json = JSON.parse(lines[i * 2 + 1]);
    } catch (e) {}

    converter(messages, json);
  }

  // The paths are returned in absolute from code analysis tools but github works
  // on paths relative from the root of the project. Doing the normalization here.
  const pwd = path.resolve('.');
  for (let absolutePath in messages) {
    const relativePath = path.relative(pwd, absolutePath);
    if (relativePath === absolutePath) {
      continue;
    }
    messages[relativePath] = messages[absolutePath];
    delete messages[absolutePath];
  }

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!process.env.GITHUB_PR_NUMBER) {
    console.error(
      'Missing GITHUB_PR_NUMBER. Example: 4687. Review feedback with code analysis results cannot be provided on GitHub without a valid pull request number.',
    );
    // for master branch, don't throw an error
    process.exit(0);
  }

  const number = process.env.GITHUB_PR_NUMBER;

  (async () => {
    await main(messages, owner, repo, number);
  })();
});
