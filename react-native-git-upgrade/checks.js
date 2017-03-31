/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const {execSync} = require('child_process');
const semver = require('semver');

function checkDeclaredVersion(declaredVersion) {
  if (!declaredVersion) {
    throw new Error(
      'Your "package.json" file doesn\'t seem to have "react-native" as a dependency.'
    );
  }
}

function checkMatchingVersions(currentVersion, declaredVersion, useYarn) {
  if (!semver.satisfies(currentVersion, declaredVersion)) {
    throw new Error(
      'react-native version in "package.json" (' + declaredVersion + ') doesn\'t match ' +
      'the installed version in "node_modules" (' + currentVersion + ').\n' +
      (useYarn ?
        'Try running "yarn" to fix this.' :
        'Try running "npm install" to fix this.')
    );
  }
}

function checkReactPeerDependency(currentVersion, declaredReactVersion) {
  if (semver.lt(currentVersion, '0.21.0') && !declaredReactVersion) {
    throw new Error(
      'Your "package.json" file doesn\'t seem to have "react" as a dependency.\n' +
      '"react" was changed from a dependency to a peer dependency in react-native v0.21.0.\n' +
      'Therefore, it\'s necessary to include "react" in your project\'s dependencies.\n' +
      'Please run "npm install --save react", then re-run ' +
      '"react-native upgrade".'
    );
  }
}

function checkGitAvailable() {
  try {
    execSync('git --version');
  } catch (error) {
    throw new Error(
      '"react-native-git-upgrade" requires "git" to be available in path. ' +
      'Please install Git (https://git-scm.com)"'
    );
  }
}

module.exports = {
  checkDeclaredVersion,
  checkMatchingVersions,
  checkReactPeerDependency,
  checkGitAvailable,
};
