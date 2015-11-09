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
  'node_modules/react-haste/renderers/shared/event/eventPlugins/ResponderEventPlugin.js',
  'node_modules/react-haste/React.js',
  'node_modules/react-haste/renderers/dom/ReactDOM.js',

  // For each of these fbjs files (especially the non-forks/stubs), we should
  // consider deleting the conflicting copy and just using the fbjs version.
  'node_modules/fbjs-haste/__forks__/Map.js',
  'node_modules/fbjs-haste/__forks__/Promise.js',
  'node_modules/fbjs-haste/__forks__/fetch.js',
  'node_modules/fbjs-haste/core/Deferred.js',
  'node_modules/fbjs-haste/core/PromiseMap.js',
  'node_modules/fbjs-haste/core/areEqual.js',
  'node_modules/fbjs-haste/core/flattenArray.js',
  'node_modules/fbjs-haste/core/isEmpty.js',
  'node_modules/fbjs-haste/core/removeFromArray.js',
  'node_modules/fbjs-haste/core/resolveImmediate.js',
  'node_modules/fbjs-haste/core/sprintf.js',
  'node_modules/fbjs-haste/crypto/crc32.js',
  'node_modules/fbjs-haste/fetch/fetchWithRetries.js',
  'node_modules/fbjs-haste/functional/everyObject.js',
  'node_modules/fbjs-haste/functional/filterObject.js',
  'node_modules/fbjs-haste/functional/forEachObject.js',
  'node_modules/fbjs-haste/functional/someObject.js',
  'node_modules/fbjs-haste/request/xhrSimpleDataSerializer.js',
  'node_modules/fbjs-haste/stubs/ErrorUtils.js',
  'node_modules/fbjs-haste/stubs/URI.js',
  'node_modules/fbjs-haste/useragent/UserAgent.js',
  'node_modules/fbjs-haste/utils/nullthrows.js',

  // Those conflicts with the ones in fbjs-haste/. We need to blacklist the
  // internal version otherwise they won't work in open source.
  'downstream/core/CSSCore.js',
  'downstream/core/TouchEventUtils.js',
  'downstream/core/camelize.js',
  'downstream/core/createArrayFromMixed.js',
  'downstream/core/createNodesFromMarkup.js',
  'downstream/core/dom/containsNode.js',
  'downstream/core/dom/focusNode.js',
  'downstream/core/dom/getActiveElement.js',
  'downstream/core/dom/getUnboundedScrollPosition.js',
  'downstream/core/dom/isNode.js',
  'downstream/core/dom/isTextNode.js',
  'downstream/core/emptyFunction.js',
  'downstream/core/emptyObject.js',
  'downstream/core/getMarkupWrap.js',
  'downstream/core/hyphenate.js',
  'downstream/core/hyphenateStyleName.js',
  'downstream/core/invariant.js',
  'downstream/core/nativeRequestAnimationFrame.js',
  'downstream/core/toArray.js',
  'downstream/functional/mapObject.js',
  'downstream/key-mirror/keyMirror.js',
  'downstream/key-mirror/keyOf.js',
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
