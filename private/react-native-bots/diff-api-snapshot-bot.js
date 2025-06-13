/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
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

if (!process.env.GITHUB_PR_NUMBER) {
    console.error(
      'Missing GITHUB_PR_NUMBER. Example: 4687. Review feedback with diff-api-snapshot result cannot be provided on GitHub without a valid pull request number.',
    );
    // for master branch, don't throw an error
    process.exit(0);
}


async function main() {
    // https://octokit.github.io/rest.js/
    const {Octokit} = require('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const issue_number = parseInt(process.env.GITHUB_PR_NUMBER, 10);
    const snapshot_output = JSON.parse(process.env.SNAPSHOT_OUTPUT);

    const commentBody = `
    **API Breaking Change Detection Result**:
    **Snapshot Comparison**:
    \`\`\`json
    {
    "result": "${snapshot_output.result}",
    "changedApis": [${snapshot_output.changedApis.map(api => `"${api}"`).join(', ')}]
    }
    \`\`\`
    `;

    await octokit.issues.createComment({
        owner,
        repo,
        issue_number,
        body: commentBody,
    });
}

main().catch(err => {
    console.error('Error posting PR comment:', err);
    process.exit(1);
});
