/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {exec, echo, exit, test, env, pushd, popd} = require('shelljs');
const {createHermesPrebuiltArtifactsTarball} = require('./hermes/hermes-utils');

function generateAndroidArtifacts(releaseVersion) {
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
    return `react-android-${releaseVersion}${suffix}`;
  });

  artifacts.forEach(name => {
    if (
      !test(
        '-e',
        `/tmp/maven-local/com/facebook/react/react-android/${releaseVersion}/${name}`,
      )
    ) {
      echo(
        `Failing as expected file: \n\
      /tmp/maven-local/com/facebook/react/react-android/${releaseVersion}/${name}\n\
      was not correctly generated.`,
      );
      exit(1);
    }
  });
}

function publishAndroidArtifactsToMaven(releaseVersion, isNightly) {
  // -------- Publish every artifact to Maven Central
  // The GPG key is base64 encoded on CircleCI and then decoded here
  let buff = Buffer.from(env.ORG_GRADLE_PROJECT_SIGNING_KEY_ENCODED, 'base64');
  env.ORG_GRADLE_PROJECT_SIGNING_KEY = buff.toString('ascii');

  // We want to gate ourselves against accidentally publishing a 1.x or a 1000.x on
  // maven central which will break the semver for our artifacts.
  if (!isNightly && releaseVersion.startsWith('0.')) {
    // -------- For stable releases, we also need to close and release the staging repository.
    if (
      exec(
        './gradlew publishAllToSonatype closeAndReleaseSonatypeStagingRepository',
      ).code
    ) {
      echo(
        'Failed to close and release the staging repository on Sonatype (Maven Central)',
      );
      exit(1);
    }
  } else {
    // -------- For nightly releases, we only need to publish the snapshot to Sonatype snapshot repo.
    if (exec('./gradlew publishAllToSonatype -PisNightly=' + isNightly).code) {
      echo('Failed to publish artifacts to Sonatype (Maven Central)');
      exit(1);
    }
  }

  echo('Published artifacts to Maven Central');
}

function generateiOSArtifacts(
  jsiFolder,
  hermesCoreSourceFolder,
  buildType,
  targetFolder,
) {
  pushd(`${hermesCoreSourceFolder}`);

  //Need to generate hermesc
  exec(
    `${hermesCoreSourceFolder}/utils/build-hermesc-xcode.sh ${hermesCoreSourceFolder}/build_host_hermesc`,
  );

  //Generating iOS Artifacts
  exec(
    `JSI_PATH=${jsiFolder} BUILD_TYPE=${buildType} ${hermesCoreSourceFolder}/utils/build-mac-framework.sh`,
  );

  exec(
    `JSI_PATH=${jsiFolder} BUILD_TYPE=${buildType} ${hermesCoreSourceFolder}/utils/build-ios-framework.sh`,
  );

  popd();

  const tarballOutputPath = createHermesPrebuiltArtifactsTarball(
    hermesCoreSourceFolder,
    buildType,
    targetFolder,
    true, // this is excludeDebugSymbols, we keep it as the default
  );

  return tarballOutputPath;
}

function failIfTagExists(version, buildType) {
  // When dry-run in stable branch, the tag already exists.
  // We are bypassing the tag-existence check when in a dry-run to have the CI pass
  if (buildType === 'dry-run') {
    return;
  }

  if (checkIfTagExists(version)) {
    echo(`Tag v${version} already exists.`);
    echo('You may want to rollback the last commit');
    echo('git reset --hard HEAD~1');
    exit(1);
  }
}

function checkIfTagExists(version) {
  const {code, stdout} = exec('git tag -l', {silent: true});
  if (code !== 0) {
    throw new Error('Failed to retrieve the list of tags');
  }
  const tags = new Set(stdout.split('\n'));
  return tags.has(`v${version}`);
}

module.exports = {
  generateAndroidArtifacts,
  generateiOSArtifacts,
  publishAndroidArtifactsToMaven,
  failIfTagExists,
};
