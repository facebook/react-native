/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  CIRCLE_BUILD_URL,
  GITHUB_OWNER,
  GITHUB_PR_NUMBER,
  GITHUB_REPO,
  GITHUB_SHA,
  GITHUB_TOKEN,
} = process.env;

const {
  createOrUpdateComment,
  validateEnvironment: validateEnvironmentForMakeComment,
} = require('./make-comment');

/**
 * Creates or updates a comment with specified pattern.
 * @param {{ auth: string; owner: string; repo: string; issue_number: string; }} params
 * @param {string} buildURL link to circleCI build
 * @param {string} commitSha github sha of PR
 */
function postArtifactLink(params, buildUrl, commitSha) {
  // build url link is redirected by CircleCI so appending `/artifacts` doesn't work
  const artifactLink = buildUrl;
  const comment = [
    `PR build artifact${
      commitSha != null ? ` for ${commitSha}` : ''
    } is ready.`,
    `To use, download tarball from "Artifacts" tab in [this CircleCI job](${artifactLink}) then run \`yarn add <path to tarball>\` in your React Native project.`,
  ].join('\n');
  createOrUpdateComment(params, comment);
}

/**
 * Validates that required environment variables are set.
 * @returns {boolean} `true` if everything is in order; `false` otherwise.
 */
function validateEnvironment() {
  if (
    !validateEnvironmentForMakeComment() ||
    !CIRCLE_BUILD_URL ||
    !GITHUB_SHA
  ) {
    if (!GITHUB_SHA) {
      console.error("Missing GITHUB_SHA. This should've been set by the CI.");
    }
    if (!CIRCLE_BUILD_URL) {
      console.error(
        "Missing CIRCLE_BUILD_URL. This should've been set by the CI.",
      );
    }
    return false;
  }

  console.log(`  GITHUB_SHA=${GITHUB_SHA}`);
  console.log(`  CIRCLE_BUILD_URL=${CIRCLE_BUILD_URL}`);

  return true;
}

if (!validateEnvironment()) {
  process.exit(1);
}

try {
  const params = {
    auth: GITHUB_TOKEN,
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    issue_number: GITHUB_PR_NUMBER,
  };
  postArtifactLink(params, CIRCLE_BUILD_URL, GITHUB_SHA);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
