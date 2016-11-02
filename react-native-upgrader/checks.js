/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

import {execSync} from 'child_process';
import semver from 'semver';

export function checkDeclaredVersion({declaredVersion}) {
  if (!declaredVersion) {
    throw new Error(
      'Your \'package.json\' file doesn\'t seem to have \'react-native\' as a dependency.'
    );
  }
}

export function checkMatchingVersions({currentVersion, declaredVersion}) {
  if (!semver.satisfies(currentVersion, declaredVersion)) {
    throw new Error(
      'react-native version in \'package.json\' doesn\'t match the installed version in \'node_modules\'.\n' +
      'Try running \'npm install\' to fix the issue.'
    );
  }
}

export function checkReactPeerDependency({currentVersion, declaredReactVersion}) {
  if (semver.lt(currentVersion, '0.21.0') && !declaredReactVersion) {
    throw new Error(
      'Your \'package.json\' file doesn\'t seem to have \'react\' as a dependency.\n' +
      '\'react\' was changed from a dependency to a peer dependency in react-native v0.21.0.\n' +
      'Therefore, it\'s necessary to include \'react\' in your project\'s dependencies.\n' +
      'Just run \'npm install --save react\', then re-run \'react-native git-upgrade\'.\n'
    );
  }
}

export function checkGitAvailable() {
  try {
    execSync('git --version');
  } catch (error) {
    throw new Error(
      'This process heavily relies on \'Git\' and it must available in the system path.\n' +
      'Install \'Git\' (https://git-scm.com) or use the original process: \'react-native upgrade\'.\n'
    );
  }
}

export function checkNewVersion({cliVersion}, npmRegistryVersion) {
  const newVersion = semver.clean(npmRegistryVersion);
  if (!semver.valid(newVersion) && cliVersion) {
    throw new Error(
      'The specified version ' + cliVersion + ' doesn\'t exist.\n' +
      'Re-run the git-upgrade command with an existing version,\n' +
      'or without argument to upgrade to the latest: \'react-native git-upgrade\'.'
    );
  }

  return newVersion;
}
