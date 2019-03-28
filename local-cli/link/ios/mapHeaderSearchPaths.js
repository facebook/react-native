/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Given Xcode project and path, iterate over all build configurations
 * and execute func with HEADER_SEARCH_PATHS from current section
 *
 * We cannot use builtin addToHeaderSearchPaths method since react-native init does not
 * use $(TARGET_NAME) for PRODUCT_NAME, but sets it manually so that method will skip
 * that target.
 *
 * To workaround that issue and make it more bullet-proof for different names,
 * we iterate over all configurations and look for `lc++` linker flag to detect
 * React Native target.
 *
 * Important: That function mutates `buildSettings` and it's not pure thus you should
 * not rely on its return value
 */
const defaultHeaderPaths = ['"$(inherited)"'];

module.exports = function headerSearchPathIter(project, func) {
  const config = project.pbxXCBuildConfigurationSection();

  Object.keys(config)
    .filter(ref => ref.indexOf('_comment') === -1)
    .forEach(ref => {
      const buildSettings = config[ref].buildSettings;
      const shouldVisitBuildSettings =
        (Array.isArray(buildSettings.OTHER_LDFLAGS)
          ? buildSettings.OTHER_LDFLAGS
          : []
        ).indexOf('"-lc++"') >= 0;

      if (shouldVisitBuildSettings) {
        const searchPaths = buildSettings.HEADER_SEARCH_PATHS
          ? [].concat(buildSettings.HEADER_SEARCH_PATHS)
          : defaultHeaderPaths;

        buildSettings.HEADER_SEARCH_PATHS = func(searchPaths);
      }
    });
};
