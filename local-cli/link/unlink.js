/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const log = require('npmlog');

const getProjectDependencies = require('./getProjectDependencies');
const unregisterDependencyAndroid = require('./android/unregisterNativeModule');
const unregisterDependencyIOS = require('./ios/unregisterNativeModule');
const unregisterDependencyPods = require('./pods/unregisterNativeModule');
const isInstalledAndroid = require('./android/isInstalled');
const isInstalledIOS = require('./ios/isInstalled');
const isInstalledPods = require('./pods/isInstalled');
const unlinkAssetsAndroid = require('./android/unlinkAssets');
const unlinkAssetsIOS = require('./ios/unlinkAssets');
const getDependencyConfig = require('./getDependencyConfig');
const compact = require('lodash').compact;
const difference = require('lodash').difference;
const filter = require('lodash').filter;
const flatten = require('lodash').flatten;
const isEmpty = require('lodash').isEmpty;
const promiseWaterfall = require('./promiseWaterfall');
const commandStub = require('./commandStub');
const promisify = require('./promisify');

log.heading = 'rnpm-link';

const unlinkDependencyAndroid = (androidProject, dependency, packageName) => {
  if (!androidProject || !dependency.android) {
    return;
  }

  const isInstalled = isInstalledAndroid(androidProject, packageName);

  if (!isInstalled) {
    log.info(`Android module ${packageName} is not installed`);
    return;
  }

  log.info(`Unlinking ${packageName} android dependency`);

  unregisterDependencyAndroid(packageName, dependency.android, androidProject);

  log.info(`Android module ${packageName} has been successfully unlinked`);
};

const unlinkDependencyPlatforms = (platforms, project, dependency, packageName) => {

  const ignorePlatforms = ['android', 'ios'];
  Object.keys(platforms || {})
    .filter(platform => ignorePlatforms.indexOf(platform) < 0)
    .forEach(platform => {
      if (!project[platform] || !dependency[platform]) {
        return null;
      }

      const linkConfig = platforms[platform] && platforms[platform].linkConfig && platforms[platform].linkConfig();
      if (!linkConfig || !linkConfig.isInstalled || !linkConfig.unregister) {
        return null;
      }

      const isInstalled = linkConfig.isInstalled(project[platform], dependency[platform]);

      if (!isInstalled) {
        log.info(`Platform '${platform}' module ${packageName} is not installed`);
        return;
      }

      log.info(`Unlinking ${packageName} ${platform} dependency`);

      linkConfig.unregister(
        packageName,
        dependency[platform],
        project[platform]
      );

      log.info(`Platform '${platform}' module ${dependency.name} has been successfully unlinked`);
    });
};

const unlinkDependencyIOS = (iOSProject, dependency, packageName, iOSDependencies) => {
  if (!iOSProject || !dependency.ios) {
    return;
  }

  const isIosInstalled = isInstalledIOS(iOSProject, dependency.ios);
  const isPodInstalled = isInstalledPods(iOSProject, dependency.ios);
  if (!isIosInstalled && !isPodInstalled) {
    log.info(`iOS module ${packageName} is not installed`);
    return;
  }

  log.info(`Unlinking ${packageName} ios dependency`);

  if (isIosInstalled) {
    unregisterDependencyIOS(dependency.ios, iOSProject, iOSDependencies);
  }
  else if (isPodInstalled) {
    unregisterDependencyPods(dependency.ios, iOSProject);
  }

  log.info(`iOS module ${packageName} has been successfully unlinked`);
};

/**
 * Updates project and unlink specific dependency
 *
 * If optional argument [packageName] is provided, it's the only one
 * that's checked
 */
function unlink(args, config) {
  const packageName = args[0];

  let platforms;
  let project;
  let dependency;

  try {
    platforms = config.getPlatformConfig();
    project = config.getProjectConfig();
  } catch (err) {
    log.error(
      'ERRPACKAGEJSON',
      'No package found. Are you sure it\'s a React Native project?'
    );
    return Promise.reject(err);
  }

  try {
    dependency = config.getDependencyConfig(packageName);
  } catch (err) {
    log.warn(
      'ERRINVALIDPROJ',
      `Project ${packageName} is not a react-native library`
    );
    return Promise.reject(err);
  }

  const allDependencies = getDependencyConfig(config, getProjectDependencies());
  const otherDependencies = filter(allDependencies, d => d.name !== packageName);
  const iOSDependencies = compact(otherDependencies.map(d => d.config.ios));

  const tasks = [
    () => promisify(dependency.commands.preunlink || commandStub),
    () => unlinkDependencyAndroid(project.android, dependency, packageName),
    () => unlinkDependencyIOS(project.ios, dependency, packageName, iOSDependencies),
    () => unlinkDependencyPlatforms(platforms, project, dependency, packageName),
    () => promisify(dependency.commands.postunlink || commandStub)
  ];

  return promiseWaterfall(tasks)
    .then(() => {
      // @todo move all these to `tasks` array, just like in
      // link
      const assets = difference(
        dependency.assets,
        flatten(allDependencies, d => d.assets)
      );

      if (isEmpty(assets)) {
        return Promise.resolve();
      }

      if (project.ios) {
        log.info('Unlinking assets from ios project');
        unlinkAssetsIOS(assets, project.ios);
      }

      if (project.android) {
        log.info('Unlinking assets from android project');
        unlinkAssetsAndroid(assets, project.android.assetsPath);
      }

      log.info(
        `${packageName} assets has been successfully unlinked from your project`
      );
    })
    .catch(err => {
      log.error(
        `It seems something went wrong while unlinking. Error: ${err.message}`
      );
      throw err;
    });
}

module.exports = {
  func: unlink,
  description: 'unlink native dependency',
  name: 'unlink <packageName>',
};
