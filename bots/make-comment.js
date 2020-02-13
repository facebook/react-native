/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_PR_NUMBER} = process.env;
if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !GITHUB_PR_NUMBER) {
  if (!GITHUB_TOKEN) {
    console.error(
      'Missing GITHUB_TOKEN. Example: 5fd88b964fa214c4be2b144dc5af5d486a2f8c1e. PR feedback cannot be provided on GitHub without a valid token.',
    );
  }
  if (!GITHUB_OWNER) {
    console.error('Missing GITHUB_OWNER. Example: facebook');
  }
  if (!GITHUB_REPO) {
    console.error('Missing GITHUB_REPO. Example: react-native');
  }
  if (!GITHUB_PR_NUMBER) {
    console.error(
      'Missing GITHUB_PR_NUMBER. Example: 4687. PR feedback cannot be provided on GitHub without a valid pull request number.',
    );
  }
  process.exit(1);
}

const {[2]: body} = process.argv;
if (!body) {
  process.exit(0);
}

const octokit = require('@octokit/rest')();
octokit.authenticate({
  type: 'oauth',
  token: GITHUB_TOKEN,
});
octokit.issues.createComment({
  owner: GITHUB_OWNER,
  repo: GITHUB_REPO,
  issue_number: GITHUB_PR_NUMBER,
  body,
});
