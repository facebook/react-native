/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
const getProjectDependencies = require('./getProjectDependencies');
const getDependencyConfig = require('./getDependencyConfig');
const pollParams = require('./pollParams');
const commandStub = require('./commandStub');
const promisify = require('./promisify');
const findReactNativeScripts = require('../util/findReactNativeScripts');

import type {RNConfig} from '../core';

log.heading = 'rnpm-link';

const dedupeAssets = (assets) => uniqBy(assets, asset => path.basename(asset));

const linkDependency = async (platforms, project, dependency) => {
  const params = await pollParams(dependency.config.params);

  Object.keys(platforms || {})
    .forEach(platform => {
      if (!project[platform] || !dependency.config[platform]) {
        return null;
      }

      const linkConfig = platforms[platform] && platforms[platform].linkConfig && platforms[platform].linkConfig();
      if (!linkConfig || !linkConfig.isInstalled || !linkConfig.register) {
        return null;
      }

      const isInstalled = linkConfig.isInstalled(project[platform], dependency.name, dependency.config[platform]);

      if (isInstalled) {
        log.info(chalk.grey(`Platform '${platform}' module ${dependency.name} is already linked`));
        return null;
      }

      log.info(`Linking ${dependency.name} ${platform} dependency`);

      linkConfig.register(
        dependency.name,
        dependency.config[platform],
        params,
        project[platform]
      );

      log.info(`Platform '${platform}' module ${dependency.name} has been successfully linked`);
    });
};

const linkAssets = (platforms, project, assets) => {
  if (isEmpty(assets)) {
    return;
  }

  Object.keys(platforms || {})
    .forEach(platform => {
      const linkConfig = platforms[platform] && platforms[platform].linkConfig && platforms[platform].linkConfig();
      if (!linkConfig || !linkConfig.copyAssets) {
        return;
      }

      log.info(`Linking assets to ${platform} project`);
      linkConfig.copyAssets(assets, project[platform]);
    });

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
  let project;
  let platforms;
  try {
    project = config.getProjectConfig();
    platforms = config.getPlatformConfig();
  } catch (err) {
    log.error(
      'ERRPACKAGEJSON',
      'No package found. Are you sure this is a React Native project?'
    );
    return Promise.reject(err);
  }

  const hasProjectConfig = Object.keys(platforms).reduce((acc, key) => acc || key in project, false);
  if (!hasProjectConfig && findReactNativeScripts()) {
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
    (acc, dependency) => acc.concat(dependency.config.assets),
    project.assets
  ));

  const tasks = flatten(dependencies.map(dependency => [
    () => promisify(dependency.config.commands.prelink || commandStub),
    () => linkDependency(platforms, project, dependency),
    () => promisify(dependency.config.commands.postlink || commandStub),
  ]));

  tasks.push(() => linkAssets(platforms, project, assets));

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
