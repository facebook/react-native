/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const copyProjectTemplateAndReplace = require('../generator/copyProjectTemplateAndReplace');
const path = require('path');
const fs = require('fs');

/**
 * The eject command re-creates the `android` and `ios` native folders. Because native code can be
 * difficult to maintain, this new script allows an `app.json` to be defined for the project, which
 * is used to configure the native app.
 *
 * The `app.json` config may contain the following keys:
 *
 * - `name` - The short name used for the project, should be TitleCase
 * - `displayName` - The app's name on the home screen
 */

function eject() {

  const doesIOSExist = fs.existsSync(path.resolve('ios'));
  const doesAndroidExist = fs.existsSync(path.resolve('android'));
  if (doesIOSExist && doesAndroidExist) {
    console.error(
      'Both the iOS and Android folders already exist! Please delete `ios` and/or `android` ' +
      'before ejecting.'
    );
    process.exit(1);
  }

  let appConfig = null;
  try {
    appConfig = require(path.resolve('app.json'));
  } catch (e) {
    console.error(
      'Eject requires an `app.json` config file to be located at ' +
      `${path.resolve('app.json')}, and it must at least specify a \`name\` for the project ` +
      'name, and a `displayName` for the app\'s home screen label.'
    );
    process.exit(1);
  }

  const appName = appConfig.name;
  if (!appName) {
    console.error(
      'App `name` must be defined in the `app.json` config file to define the project name. ' +
      'It must not contain any spaces or dashes.'
    );
    process.exit(1);
  }
  const displayName = appConfig.displayName;
  if (!displayName) {
    console.error(
      'App `displayName` must be defined in the `app.json` config file, to define the label ' +
      'of the app on the home screen.'
    );
    process.exit(1);
  }

  const templateOptions = { displayName };

  if (!doesIOSExist) {
    console.log('Generating the iOS folder.');
    copyProjectTemplateAndReplace(
      path.resolve('node_modules', 'react-native', 'local-cli', 'templates', 'HelloWorld', 'ios'),
      path.resolve('ios'),
      appName,
      templateOptions
    );
  }

  if (!doesAndroidExist) {
    console.log('Generating the Android folder.');
    copyProjectTemplateAndReplace(
      path.resolve('node_modules', 'react-native', 'local-cli', 'templates', 'HelloWorld', 'android'),
      path.resolve('android'),
      appName,
      templateOptions
    );
  }

}

module.exports = {
  name: 'eject',
  description: 'Re-create the iOS and Android folders and native code',
  func: eject,
  options: [],
};
