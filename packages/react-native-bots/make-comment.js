/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * Updates the comment matching specified pattern.
 * @param {import('@octokit/rest').Octokit} octokit Octokit instance
 * @param {{ owner: string; repo: string; issue_number: string; }} issueParams
 * @param {string} body Comment body
 * @param {string} replacePattern Pattern for finding the comment to update
 */
async function updateComment(octokit, issueParams, body, replacePattern) {
  if (!replacePattern) {
    return false;
  }

  const authenticatedUser = await octokit.users.getAuthenticated();
  if (authenticatedUser.status !== 200 || !authenticatedUser.data) {
    console.warn(authenticatedUser);
    return false;
  }

  const comments = await octokit.issues.listComments(issueParams);
  if (comments.status !== 200 || !comments.data) {
    console.warn(comments);
    return false;
  }

  const authedUserId = authenticatedUser.data.id;
  const pattern = new RegExp(replacePattern, 'g');
  const comment = comments.data.find(
    // eslint-disable-next-line no-shadow
    ({user, body}) => user.id === authedUserId && pattern.test(body),
  );
  if (!comment) {
    return false;
  }

  octokit.issues.updateComment({
    ...issueParams,
    comment_id: comment.id,
    body,
  });
  return true;
}

/**
 * Creates or updates a comment with specified pattern.
 * @param {{ auth: string; owner: string; repo: string; issue_number: string; }} params
 * @param {string} body Comment body
 * @param {string} replacePattern Pattern for finding the comment to update
 */
async function createOrUpdateComment(
  {auth, ...issueParams},
  body,
  replacePattern,
) {
  if (!body) {
    return;
  }

  const {Octokit} = require('@octokit/rest');
  const octokit = new Octokit({auth});

  if (await updateComment(octokit, issueParams, body, replacePattern)) {
    return;
  }

  // We found no comments to replace, so we'll create a new one.

  octokit.issues.createComment({
    ...issueParams,
    body,
  });
}

/**
 * Validates that required environment variables are set.
 * @returns {boolean} `true` if everything is in order; `false` otherwise.
 */
function validateEnvironment() {
  const {
    GITHUB_TOKEN,
    GITHUB_OWNER,
    GITHUB_REPO,
    GITHUB_PR_NUMBER,
    GITHUB_REF,
  } = process.env;

  // We need the following variables to post a comment on a PR
  if (
    !GITHUB_TOKEN ||
    !GITHUB_OWNER ||
    !GITHUB_REPO ||
    !GITHUB_PR_NUMBER ||
    !GITHUB_REF
  ) {
    if (!GITHUB_TOKEN) {
      console.error(
        'Missing GITHUB_TOKEN. Example: ghp_5fd88b964fa214c4be2b144dc5af5d486a2. PR feedback cannot be provided on GitHub without a valid token.',
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
    if (!GITHUB_REF) {
      console.error("Missing GITHUB_REF. This should've been set by the CI.");
    }

    return false;
  }
  console.log('  GITHUB_TOKEN=REDACTED');
  console.log(`  GITHUB_OWNER=${GITHUB_OWNER}`);
  console.log(`  GITHUB_REPO=${GITHUB_REPO}`);
  console.log(`  GITHUB_PR_NUMBER=${GITHUB_PR_NUMBER}`);
  console.log(`  GITHUB_REF=${GITHUB_REF}`);

  return true;
}

module.exports = {
  createOrUpdateComment,
  validateEnvironment,
};
