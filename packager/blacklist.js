/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var path = require('path');

// Don't forget to everything listed here to `testConfig.json`
// modulePathIgnorePatterns.
var sharedBlacklist = [
  'website',
  'node_modules/react-tools/src/utils/ImmutableObject.js',
  'node_modules/react-tools/src/core/ReactInstanceHandles.js',
  'node_modules/react-tools/src/event/EventPropagators.js'
];

var platformBlacklists = {
  web: [
    '.ios.js'
  ],
  ios: [
    'node_modules/react-tools/src/browser/ui/React.js',
    'node_modules/react-tools/src/browser/eventPlugins/ResponderEventPlugin.js',
    'node_modules/react-tools/src/vendor/core/ExecutionEnvironment.js',
    '.web.js',
    '.android.js',
  ],
  android: [
    'node_modules/react-tools/src/browser/ui/React.js',
    'node_modules/react-tools/src/browser/eventPlugins/ResponderEventPlugin.js',
    'node_modules/react-tools/src/browser/ReactTextComponent.js',
    'node_modules/react-tools/src/vendor/core/ExecutionEnvironment.js',
    '.web.js',
    '.ios.js',
  ],
};

function escapeRegExp(str) {
  var escaped = str.replace(/[\-\[\]\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  // convert the '/' into an escaped local file separator
  return escaped.replace(/\//g,'\\' + path.sep);
}

function blacklist(platform, additionalBlacklist) {
  return new RegExp('(' +
    (additionalBlacklist || []).concat(sharedBlacklist)
      .concat(platformBlacklists[platform] || [])
      .map(escapeRegExp)
      .join('|') +
    ')$'
  );
}

module.exports = blacklist;
