/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {GITHUB_TOKEN, CIRCLE_BUILD_URL, GITHUB_SHA} = process.env;
if (!GITHUB_TOKEN || !CIRCLE_BUILD_URL) {
  if (!GITHUB_TOKEN) {
    console.error("Missing GITHUB_TOKEN. This should've been set by the CI.");
  }
  if (!CIRCLE_BUILD_URL) {
    console.error(
      "Missing CIRCLE_BUILD_URL. This should've been set by the CI.",
    );
  }
  process.exit(1);
}

const {createOrUpdateComment} = require('./make-comment');

/**
 * Creates or updates a comment with specified pattern.
 * @param {string} buildURL link to circleCI build
 * @param {string} commitSha github sha of PR
 */
function postArtifactLink(buildUrl, commitSha) {
  const artifactLink = buildUrl + '/artifacts';
  const comment = [
    `PR build artifact${
      commitSha != null ? ` for ${commitSha}` : ''
    } is ready.`,
    `To use, download tarball from [this CircleCI job](${artifactLink}) then run \`yarn add <path to tarball>\` in your React Native project.`,
  ].join('\n');
  createOrUpdateComment(comment);
}

try {
  postArtifactLink(CIRCLE_BUILD_URL, GITHUB_SHA);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
