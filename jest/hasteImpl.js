/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const path = require('path');
const cli = require('@react-native-community/cli');

// Use duck-typing because of Facebook-internal infra that doesn't have the cli package.
const {haste} = (cli.loadConfig && cli.loadConfig()) || {
  haste: {
    providesModuleNodeModules: [],
    platforms: ['ios', 'android'],
  },
};

// Detect out-of-tree platforms and add them to the whitelists
const pluginRoots /*: Array<string> */ = haste.providesModuleNodeModules.map(
  name => path.resolve(__dirname, '../../', name) + path.sep,
);

const pluginNameReducers /*: Array<[RegExp, string]> */ = haste.platforms.map(
  name => [new RegExp(`^(.*)\\.(${name})$`), '$1'],
);

const ROOTS = [path.resolve(__dirname, '..') + path.sep, ...pluginRoots];

const BLACKLISTED_PATTERNS /*: Array<RegExp> */ = [
  /.*[\\\/]__(mocks|tests)__[\\\/].*/,
  /^Libraries[\\\/]Animated[\\\/]src[\\\/]polyfills[\\\/].*/,
  /^Libraries[\\\/]Renderer[\\\/]fb[\\\/].*/,
  /DerivedData[\\\/].*/,
];

const WHITELISTED_PREFIXES /*: Array<string> */ = [
  'IntegrationTests',
  'Libraries',
  'ReactAndroid',
  'RNTester',
];

const NAME_REDUCERS /*: Array<[RegExp, string]> */ = [
  // extract basename
  [/^(?:.*[\\\/])?([a-zA-Z0-9$_.-]+)$/, '$1'],
  // strip .js/.js.flow suffix
  [/^(.*)\.js(\.flow)?$/, '$1'],
  // strip native suffix
  [/^(.*)\.(native)$/, '$1'],
  // strip plugin platform suffixes
  ...pluginNameReducers,
];

function isHastePath(filePath /*: string */) /*: boolean */ {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.js.flow')) {
    return false;
  }

  const root = ROOTS.find(r => filePath.startsWith(r));
  if (!root) {
    return false;
  }

  filePath = filePath.substr(root.length);
  if (BLACKLISTED_PATTERNS.some(pattern => pattern.test(filePath))) {
    return false;
  }
  return WHITELISTED_PREFIXES.some(prefix => filePath.startsWith(prefix));
}

module.exports = {
  /*
   * @return {string|void} hasteName for module at filePath; or undefined if
   *                       filePath is not a haste module
   */
  getHasteName(
    filePath /*: string */,
    sourceCode /*: ?string */,
  ) /*: string | void */ {
    if (!isHastePath(filePath)) {
      return undefined;
    }

    const hasteName = NAME_REDUCERS.reduce(
      (name, [pattern, replacement]) => name.replace(pattern, replacement),
      filePath,
    );

    return hasteName;
  },
};
