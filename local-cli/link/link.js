/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const log = require('npmlog');
const path = require('path');
const uniqBy = require('lodash').uniqBy;
const flatten = require('lodash').flatten;
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const chalk = require('chalk');

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const isEmpty = require('lodash').isEmpty;
const promiseWaterfall = require('./promiseWaterfall');
const registerDependencyAndroid = require('./android/registerNativeModule');
const registerDependencyWindows = require('./windows/registerNativeModule');
const registerDependencyIOS = require('./ios/registerNativeModule');
const registerDependencyPods = require('./pods/registerNativeModule');
const isInstalledAndroid = require('./android/isInstalled');
const isInstalledWindows = require('./windows/isInstalled');
const isInstalledIOS = require('./ios/isInstalled');
const isInstalledPods = require('./pods/isInstalled');
const copyAssetsAndroid = require('./android/copyAssets');
const copyAssetsIOS = require('./ios/copyAssets');
const getProjectDependencies = require('./getProjectDependencies');
const getDependencyConfig = require('./getDependencyConfig');
const pollParams = require('./pollParams');
const commandStub = require('./commandStub');
const promisify = require('./promisify');
const findReactNativeScripts = require('../util/findReactNativeScripts');

import type {RNConfig} from '../core';

log.heading = 'rnpm-link';

const dedupeAssets = (assets) => uniqBy(assets, asset => path.basename(asset));


const linkDependencyAndroid = (androidProject, dependency) => {
  if (!androidProject || !dependency.config.android) {
    return null;
  }

  const isInstalled = isInstalledAndroid(androidProject, dependency.name);

  if (isInstalled) {
    log.info(chalk.grey(`Android module ${dependency.name} is already linked`));
    return null;
  }

  return pollParams(dependency.config.params).then(params => {
    log.info(`Linking ${dependency.name} android dependency`);

    registerDependencyAndroid(
      dependency.name,
      dependency.config.android,
      params,
      androidProject
    );

    log.info(`Android module ${dependency.name} has been successfully linked`);
  });
};

const linkDependencyWindows = (windowsProject, dependency) => {

  if (!windowsProject || !dependency.config.windows) {
    return null;
  }

  const isInstalled = isInstalledWindows(windowsProject, dependency.config.windows);

  if (isInstalled) {
    log.info(chalk.grey(`Windows module ${dependency.name} is already linked`));
    return null;
  }

  return pollParams(dependency.config.params).then(params => {
    log.info(`Linking ${dependency.name} windows dependency`);

    registerDependencyWindows(
      dependency.name,
      dependency.config.windows,
      params,
      windowsProject
    );

    log.info(`Windows module ${dependency.name} has been successfully linked`);
  });
};

const linkDependencyIOS = (iOSProject, dependency) => {
  if (!iOSProject || !dependency.config.ios) {
    return;
  }

  const isInstalled = isInstalledIOS(iOSProject, dependency.config.ios) || isInstalledPods(iOSProject, dependency.config.ios);
  if (isInstalled) {
    log.info(chalk.grey(`iOS module ${dependency.name} is already linked`));
    return;
  }

  log.info(`Linking ${dependency.name} ios dependency`);
  if (iOSProject.podfile && dependency.config.ios.podspec) {
    registerDependencyPods(dependency, iOSProject);
  }
  else {
    registerDependencyIOS(dependency.config.ios, iOSProject);
  }
  log.info(`iOS module ${dependency.name} has been successfully linked`);
};

const linkAssets = (project, assets) => {
  if (isEmpty(assets)) {
    return;
  }

  if (project.ios) {
    log.info('Linking assets to ios project');
    copyAssetsIOS(assets, project.ios);
  }

  if (project.android) {
    log.info('Linking assets to android project');
    copyAssetsAndroid(assets, project.android.assetsPath);
  }

  log.info('Assets have been successfully linked to your project');
};

/**
 * Updates project and links all dependencies to it.
 *
 * @param args If optional argument [packageName] is provided,
 *             only that package is processed.
 * @param config CLI config, see local-cli/core/index.js
 */
function link(args: Array<string>, config: RNConfig) {
  var project;
  try {
    project = config.getProjectConfig();
  } catch (err) {
    log.error(
      'ERRPACKAGEJSON',
      'No package found. Are you sure this is a React Native project?'
    );
    return Promise.reject(err);
  }

  if (!project.android && !project.ios && !project.windows && findReactNativeScripts()) {
    throw new Error(
      '`react-native link` can not be used in Create React Native App projects. ' +
      'If you need to include a library that relies on custom native code, ' +
      'you might have to eject first. ' +
      'See https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md ' +
      'for more information.'
    );
  }

  let packageName = args[0];
  // Check if install package by specific version (eg. package@latest)
  if (packageName !== undefined) {
    packageName = packageName.split('@')[0];
  }

  const dependencies = getDependencyConfig(
    config,
    packageName ? [packageName] : getProjectDependencies()
  );

  const assets = dedupeAssets(dependencies.reduce(
    (assets, dependency) => assets.concat(dependency.config.assets),
    project.assets
  ));

  const tasks = flatten(dependencies.map(dependency => [
    () => promisify(dependency.config.commands.prelink || commandStub),
    () => linkDependencyAndroid(project.android, dependency),
    () => linkDependencyIOS(project.ios, dependency),
    () => linkDependencyWindows(project.windows, dependency),
    () => promisify(dependency.config.commands.postlink || commandStub),
  ]));

  tasks.push(() => linkAssets(project, assets));

  return promiseWaterfall(tasks).catch(err => {
    log.error(
      `Something went wrong while linking. Error: ${err.message} \n` +
      'Please file an issue here: https://github.com/facebook/react-native/issues'
    );
    throw err;
  });
}

module.exports = {
  func: link,
  description: 'links all native dependencies (updates native build files)',
  name: 'link [packageName]',
};
