/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {exec, echo, exit, test, env} = require('shelljs');
const {saveFiles} = require('./scm-utils');

function saveFilesToRestore(tmpPublishingFolder) {
  const filesToSaveAndRestore = [
    'template/Gemfile',
    'template/_ruby-version',
    'template/package.json',
    '.ruby-version',
    'Gemfile.lock',
    'Gemfile',
    'package.json',
    'ReactAndroid/gradle.properties',
    'Libraries/Core/ReactNativeVersion.js',
    'React/Base/RCTVersion.m',
    'ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
    'ReactCommon/cxxreact/ReactNativeVersion.h',
  ];

  saveFiles(filesToSaveAndRestore, tmpPublishingFolder);
}

function generateAndroidArtifacts(releaseVersion, tmpPublishingFolder) {
  // -------- Generating Android Artifacts
  echo('Generating Android artifacts inside /tmp/maven-local');
  if (exec('./gradlew publishAllToMavenTempLocal').code) {
    echo('Could not generate artifacts');
    exit(1);
  }

  echo('Generated artifacts for Maven');

  let artifacts = [
    '.module',
    '.pom',
    '-debug.aar',
    '-release.aar',
    '-debug-sources.jar',
    '-release-sources.jar',
  ].map(suffix => {
    return `react-native-${releaseVersion}${suffix}`;
  });

  artifacts.forEach(name => {
    if (
      !test(
        '-e',
        `/tmp/maven-local/com/facebook/react/react-native/${releaseVersion}/${name}`,
      )
    ) {
      echo(
        `Failing as expected file: \n\
      /tmp/maven-local/com/facebook/react/react-native/${releaseVersion}/${name}\n\
      was not correctly generated.`,
      );
      exit(1);
    }
  });
}

function publishAndroidArtifactsToMaven(releaseVersion, isNightly) {
  // -------- Publish every artifact to Maven Central
  // The GPG key is base64 encoded on CircleCI
  let buff = Buffer.from(env.ORG_GRADLE_PROJECT_SIGNING_KEY_ENCODED, 'base64');
  env.ORG_GRADLE_PROJECT_SIGNING_KEY = buff.toString('ascii');
  if (exec('./gradlew publishAllToSonatype -PisNightly=' + isNightly).code) {
    echo('Failed to publish artifacts to Sonatype (Maven Central)');
    exit(1);
  }

  // We want to gate ourselves against accidentally publishing a 1.x or a 1000.x on
  // maven central which will break the semver for our artifacts.
  if (!isNightly && releaseVersion.startsWith('0.')) {
    // -------- For stable releases, we also need to close and release the staging repository.
    if (exec('./gradlew closeAndReleaseSonatypeStagingRepository').code) {
      echo(
        'Failed to close and release the staging repository on Sonatype (Maven Central)',
      );
      exit(1);
    }
  }

  echo('Published artifacts to Maven Central');
}

module.exports = {
  generateAndroidArtifacts,
  publishAndroidArtifactsToMaven,
  saveFilesToRestore,
};
