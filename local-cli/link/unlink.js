const log = require('npmlog');

const getProjectDependencies = require('./getProjectDependencies');
const getDependencyConfig = require('./getDependencyConfig');
const difference = require('lodash').difference;
const filter = require('lodash').filter;
const flatten = require('lodash').flatten;
const isEmpty = require('lodash').isEmpty;
const promiseWaterfall = require('./promiseWaterfall');
const commandStub = require('./commandStub');
const promisify = require('./promisify');

log.heading = 'rnpm-link';

const unlinkDependency = (platforms, project, dependency, packageName, otherDependencies) => {

  Object.keys(platforms || {})
    .forEach(platform => {
      if (!project[platform] || !dependency[platform]) {
        return;
      }

      const linkConfig = platforms[platform] && platforms[platform].linkConfig && platforms[platform].linkConfig();
      if (!linkConfig || !linkConfig.isInstalled || !linkConfig.unregister) {
        return;
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
        project[platform],
        otherDependencies
      );

      log.info(`Platform '${platform}' module ${dependency.name} has been successfully unlinked`);
    });
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

  const tasks = [
    () => promisify(dependency.commands.preunlink || commandStub),
    () => unlinkDependency(platforms, project, dependency, packageName, otherDependencies),
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

      Object.keys(platforms || {})
        .forEach(platform => {
          const linkConfig = platforms[platform] && platforms[platform].linkConfig && platforms[platform].linkConfig();
          if (!linkConfig || !linkConfig.unlinkAssets) {
            return;
          }
    
          log.info(`Unlinking assets from ${platform} project`);
          linkConfig.unlinkAssets(assets, project[platform]);
        });

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
