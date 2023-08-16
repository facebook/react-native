/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fetch = require('node-fetch');
const fs = require('fs');

const baseMavenRepo = 'https://repo1.maven.org/maven2/com/facebook/react';
const artifacts = ['react-native-artifacts', 'react-android', 'hermes-android'];
const humanNames = {
  'react-native-artifacts': 'Hermes for iOS',
  'react-android': 'React Native for Android',
  'hermes-android': 'Hermes for Android',
};
const ping_minutes = 5;
const max_hours = 5;
const ping_interval = ping_minutes * 60 * 1000; // 5 minutes
const max_wait = max_hours * 60 * 60 * 1000; // 5 hours

const startTime = Date.now();

async function pingMaven(artifact, rnVersion) {
  const url = `${baseMavenRepo}/${artifact}/${rnVersion}`;
  const response = await fetch(url, {method: 'HEAD'});
  if (response.status === 200) {
    console.log(`Found artifact for ${humanNames[artifact]}\n`);
    return;
  } else if (response.status !== 404) {
    throw new Error(
      `Unexpected response code ${response.status} for ${humanNames[artifact]}`,
    );
  }

  const elapsedTime = Date.now() - startTime;
  if (elapsedTime > max_wait) {
    throw new Error(`${max_hours} hours has passed. Exiting.`);
  }
  // Wait a bit
  console.log(
    `${humanNames[artifact]} not available yet. Waiting ${ping_minutes} minutes.\n`,
  );
  await new Promise(resolve => setTimeout(resolve, ping_interval));
  await pingMaven(url);
}

async function main() {
  const package = JSON.parse(
    fs.readFileSync('packages/react-native/package.json', 'utf8'),
  );
  const rnVersion = package.version;

  if (rnVersion === '1000.0.0') {
    console.log(
      'We are not on a release branch when a release has been initiated. Exiting.',
    );
    return;
  }

  console.log(`Checking artifacts for React Native version ${rnVersion}\n`);

  for (const artifact of artifacts) {
    console.log(`Start pinging for ${humanNames[artifact]}`);
    await pingMaven(artifact, rnVersion);
  }
}

main();
