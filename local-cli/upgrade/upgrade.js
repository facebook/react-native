/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const chalk = require('chalk');
const copyProjectTemplateAndReplace = require('../generator/copyProjectTemplateAndReplace');
const fs = require('fs');
const path = require('path');
const printRunInstructions = require('../generator/printRunInstructions');
const semver = require('semver');
const yarn = require('../util/yarn');

/**
 * Migrate application to a new version of React Native.
 * See http://facebook.github.io/react-native/docs/upgrading.html
 *
 * IMPORTANT: Assumes the cwd() is the project directory.
 * The code here must only be invoked via the CLI:
 * $ cd MyAwesomeApp
 * $ react-native upgrade
 */
function validateAndUpgrade() {
  const projectDir = process.cwd();

  const packageJSON = JSON.parse(
      fs.readFileSync(path.resolve(projectDir, 'package.json'), 'utf8')
  );

  const projectName = packageJSON.name;
  if (!projectName) {
    warn(
      'Your project needs to have a name, declared in package.json, ' +
      'such as "name": "AwesomeApp". Please add a project name. Aborting.'
    );
    return;
  }

  const version = packageJSON.dependencies['react-native'];
  if (!version) {
    warn(
      'Your "package.json" file doesn\'t seem to declare "react-native" as ' +
      'a dependency. Nothing to upgrade. Aborting.'
    );
    return;
  }

  if (version === 'latest' || version === '*') {
    warn(
      'Some major releases introduce breaking changes.\n' +
      'Please use a caret version number in your "package.json" file \n' +
      'to avoid breakage. Use e.g. react-native: ^0.38.0. Aborting.'
    );
    return;
  }

  const installed = JSON.parse(
    fs.readFileSync(
      path.resolve(projectDir, 'node_modules/react-native/package.json'),
      'utf8'
    )
  );

  if (!semver.satisfies(installed.version, version)) {
    warn(
      'react-native version in "package.json" doesn\'t match ' +
      'the installed version in "node_modules".\n' +
      'Try running "npm install" to fix this. Aborting.'
    );
    return;
  }

  const v = version.replace(/^(~|\^|=)/, '').replace(/x/i, '0');

  if (!semver.valid(v)) {
    warn(
      "A valid version number for 'react-native' is not specified in your " +
      "'package.json' file. Aborting."
    );
    return;
  }

  console.log(
    'Upgrading project to react-native v' + installed.version + '\n' +
    'Check out the release notes and breaking changes: ' +
    'https://github.com/facebook/react-native/releases/tag/v' +
    semver.major(v) + '.' + semver.minor(v) + '.0'
  );

  // >= v0.21.0, we require react to be a peer dependency
  if (semver.gte(v, '0.21.0') && !packageJSON.dependencies.react) {
    warn(
      'Your "package.json" file doesn\'t seem to have "react" as a dependency.\n' +
      '"react" was changed from a dependency to a peer dependency in react-native v0.21.0.\n' +
      'Therefore, it\'s necessary to include "react" in your project\'s dependencies.\n' +
      'Please run "npm install --save react", then re-run "react-native upgrade".\n'
    );
    return;
  }

  if (semver.satisfies(v, '~0.26.0')) {
    warn(
      'React Native 0.26 introduced some breaking changes to the native files on iOS. You can\n' +
      'perform them manually by checking the release notes or use "rnpm" ' +
      'to do it automatically.\n' +
      'Just run:\n' +
      '"npm install -g rnpm && npm install rnpm-plugin-upgrade@0.26 --save-dev", ' +
      'then run "rnpm upgrade".'
    );
  }

  return new Promise((resolve) => {
    upgradeProjectFiles(projectDir, projectName);
    console.log(
      'Successfully upgraded this project to react-native v' + installed.version
    );
    resolve();
  });
}

/**
 * Once all checks passed, upgrade the project files.
 */
function upgradeProjectFiles(projectDir, projectName) {
  // Just owerwrite
  copyProjectTemplateAndReplace(
    path.resolve('node_modules', 'react-native', 'local-cli', 'templates', 'HelloWorld'),
    projectDir,
    projectName,
    {upgrade: true}
  );
}

function warn(message) {
  console.warn(chalk.yellow(message));
}

const upgradeCommand = {
  name: 'upgrade',
  description: 'upgrade your app\'s template files to the latest version; run this after ' +
    'updating the react-native version in your package.json and running npm install',
  func: validateAndUpgrade,
};

module.exports = upgradeCommand;
