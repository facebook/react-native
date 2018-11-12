/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

const findSymlinkedModules = require('./findSymlinkedModules');
const getPolyfills = require('../../rn-get-polyfills');
const path = require('path');

const {createBlacklist} = require('metro');
/* $FlowFixMe(site=react_native_oss) */
const {loadConfig} = require('metro-config');

/**
 * Configuration file of the CLI.
 */
/* $FlowFixMe(site=react_native_oss) */
import type {ConfigT} from 'metro-config/src/configTypes.flow';

function getProjectRoot() {
  if (
    __dirname.match(/node_modules[\/\\]react-native[\/\\]local-cli[\/\\]util$/)
  ) {
    // Packager is running from node_modules.
    // This is the default case for all projects created using 'react-native init'.
    return path.resolve(__dirname, '../../../..');
  } else if (__dirname.match(/Pods[\/\\]React[\/\\]packager$/)) {
    // React Native was installed using CocoaPods.
    return path.resolve(__dirname, '../../../..');
  }
  return path.resolve(__dirname, '../..');
}

const resolveSymlinksForRoots = roots =>
  roots.reduce(
    /* $FlowFixMe(>=0.70.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.70 was deployed. To see the error delete this
     * comment and run Flow. */
    (arr, rootPath) => arr.concat(findSymlinkedModules(rootPath, roots)),
    [...roots],
  );

const getWatchFolders = () => {
  const root = process.env.REACT_NATIVE_APP_ROOT;
  if (root) {
    return resolveSymlinksForRoots([path.resolve(root)]);
  }
  return [];
};

const getBlacklistRE = () => {
  return createBlacklist([/.*\/__fixtures__\/.*/]);
};

/**
 * Module capable of getting the configuration out of a given file.
 *
 * The function will return all the default configuration, as specified by the
 * `DEFAULT` param overriden by those found on `rn-cli.config.js` files, if any. If no
 * default config is provided and no configuration can be found in the directory
 * hierarchy, an error will be thrown.
 */
const Config = {
  DEFAULT: {
    resolver: {
      resolverMainFields: ['react-native', 'browser', 'main'],
      blacklistRE: getBlacklistRE(),
    },
    serializer: {
      getModulesRunBeforeMainModule: () => [
        require.resolve('../../Libraries/Core/InitializeCore'),
      ],
      getPolyfills,
    },
    server: {
      port: process.env.RCT_METRO_PORT || 8081,
    },
    transformer: {
      babelTransformerPath: require.resolve('metro/src/reactNativeTransformer'),
    },
    watchFolders: getWatchFolders(),
  },

  async load(configFile: ?string): Promise<ConfigT> {
    const argv = {cwd: getProjectRoot()};

    return await loadConfig(
      configFile ? {...argv, config: configFile} : argv,
      this.DEFAULT,
    );
  },
};

module.exports = Config;
