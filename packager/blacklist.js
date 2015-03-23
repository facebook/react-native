/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// Don't forget to everything listed here to `testConfig.json`
// modulePathIgnorePatterns.
var sharedBlacklist = [
  __dirname,
  'website',
  'node_modules/react-tools/src/utils/ImmutableObject.js',
  'node_modules/react-tools/src/core/ReactInstanceHandles.js',
  'node_modules/react-tools/src/event/EventPropagators.js'
];

var webBlacklist = [
  '.ios.js'
];

var iosBlacklist = [
  'node_modules/react-tools/src/browser/ui/React.js',
  'node_modules/react-tools/src/browser/eventPlugins/ResponderEventPlugin.js',
  // 'node_modules/react-tools/src/vendor/core/ExecutionEnvironment.js',
  '.web.js',
  '.android.js',
];

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function blacklist(isWeb, additionalBlacklist) {
  return new RegExp('(' +
    (additionalBlacklist || []).concat(sharedBlacklist)
      .concat(isWeb ? webBlacklist : iosBlacklist)
      .map(escapeRegExp)
      .join('|') +
    ')$'
  );
}

module.exports = blacklist;
