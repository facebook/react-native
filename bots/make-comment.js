/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

module.exports = {
  createOrUpdateComment,
};
