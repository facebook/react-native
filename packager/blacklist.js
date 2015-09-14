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
  'node_modules/react-tools/src/React.js',
  'node_modules/react-tools/src/renderers/shared/event/EventPropagators.js',
  'node_modules/react-tools/src/renderers/shared/event/eventPlugins/ResponderEventPlugin.js',
  'node_modules/react-tools/src/shared/vendor/core/ExecutionEnvironment.js',
];

// Raw unescaped patterns in case you need to use wildcards
var sharedBlacklistWildcards = [
  'website\/node_modules\/.*',
];

var platformBlacklists = {
  web: [
    '.ios.js',
    '.android.js',
  ],
  ios: [
    '.web.js',
    '.android.js',
  ],
  android: [
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
      .concat(sharedBlacklistWildcards)
      .join('|') +
    ')$'
  );
}

module.exports = blacklist;
