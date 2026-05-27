/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {log, sleep} = require('./utils');

const SLEEP_S = 60; // 1 minute
const MAX_RETRIES = 90; // 90 attempts. Waiting between attempt: 1 min. Total time: 90 min.
const ARTIFACT_URL =
  'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/';
const ARTIFACT_NAME = 'react-native-artifacts-';

async function verifyArtifactsAreOnMaven(version, retries = MAX_RETRIES) {
  if (version.startsWith('v')) {
    version = version.substring(1);
  }

  const artifactUrl = `${ARTIFACT_URL}${version}/${ARTIFACT_NAME}${version}.pom`;
  for (let currentAttempt = 1; currentAttempt <= retries; currentAttempt++) {
    const response = await fetch(artifactUrl);

    if (response.status !== 200) {
      log(
        `${currentAttempt}) Artifact's for version ${version} are not on maven yet.\nURL: ${artifactUrl}\nLet's wait a minute and try again.\n`,
      );
      await sleep(SLEEP_S);
    } else {
      return;
    }
  }

  log(
    `We waited 90 minutes for the artifacts to be on Maven. Check https://status.maven.org/ if there are issues wth the service.`,
  );
  process.exit(1);
}

module.exports = {verifyArtifactsAreOnMaven};
