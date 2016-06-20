const path = require('path');
const log = require('npmlog');

const getProjectDependencies = require('./getProjectDependencies');
const unregisterDependencyAndroid = require('./android/unregisterNativeModule');
const unregisterDependencyIOS = require('./ios/unregisterNativeModule');
const isInstalledAndroid = require('./android/isInstalled');
const isInstalledIOS = require('./ios/isInstalled');
const unlinkAssetsAndroid = require('./android/unlinkAssets');
const unlinkAssetsIOS = require('./ios/unlinkAssets');
const getDependencyConfig = require('./getDependencyConfig');
const difference = require('lodash').difference;
const isEmpty = require('lodash').isEmpty;
const flatten = require('lodash').flatten;

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

const unlinkDependencyIOS = (iOSProject, dependency, packageName) => {
  if (!iOSProject || !dependency.ios) {
    return;
  }

  const isInstalled = isInstalledIOS(iOSProject, dependency.ios);

  if (!isInstalled) {
    log.info(`iOS module ${packageName} is not installed`);
    return;
  }

  log.info(`Unlinking ${packageName} ios dependency`);

  unregisterDependencyIOS(dependency.ios, iOSProject);

  log.info(`iOS module ${packageName} has been successfully unlinked`);
};

/**
 * Updates project and unlink specific dependency
 *
 * If optional argument [packageName] is provided, it's the only one
 * that's checked
 */
module.exports = function unlink(config, args) {
  const packageName = args[0];

  var project;
  var dependency;

  try {
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

  unlinkDependencyAndroid(project.android, dependency, packageName);
  unlinkDependencyIOS(project.ios, dependency, packageName);

  const allDependencies = getDependencyConfig(config, getProjectDependencies());

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

  return Promise.resolve();
};
