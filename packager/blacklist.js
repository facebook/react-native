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

// Don't forget to everything listed here to `package.json`
// modulePathIgnorePatterns.
var sharedBlacklist = [
  /node_modules[/\\]react[/\\]dist[/\\].*/,
  'node_modules/react/lib/React.js',
  'node_modules/react/lib/ReactDOM.js',

  // For each of these fbjs files (especially the non-forks/stubs), we should
  // consider deleting the conflicting copy and just using the fbjs version.
  //
  // fbjs forks:
  'node_modules/fbjs/lib/Map.js',
  'node_modules/fbjs/lib/Promise.js',
  'node_modules/fbjs/lib/fetch.js',
  // fbjs stubs:
  'node_modules/fbjs/lib/ErrorUtils.js',
  'node_modules/fbjs/lib/URI.js',
  // fbjs modules:
  'node_modules/fbjs/lib/Deferred.js',
  'node_modules/fbjs/lib/PromiseMap.js',
  'node_modules/fbjs/lib/UserAgent.js',
  'node_modules/fbjs/lib/areEqual.js',
  'node_modules/fbjs/lib/base62.js',
  'node_modules/fbjs/lib/crc32.js',
  'node_modules/fbjs/lib/everyObject.js',
  'node_modules/fbjs/lib/fetchWithRetries.js',
  'node_modules/fbjs/lib/filterObject.js',
  'node_modules/fbjs/lib/flattenArray.js',
  'node_modules/fbjs/lib/forEachObject.js',
  'node_modules/fbjs/lib/isEmpty.js',
  'node_modules/fbjs/lib/nullthrows.js',
  'node_modules/fbjs/lib/removeFromArray.js',
  'node_modules/fbjs/lib/resolveImmediate.js',
  'node_modules/fbjs/lib/someObject.js',
  'node_modules/fbjs/lib/sprintf.js',
  'node_modules/fbjs/lib/xhrSimpleDataSerializer.js',

  // Those conflicts with the ones in fbjs/. We need to blacklist the
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

  /website\/node_modules\/.*/,

  // TODO(jkassens, #9876132): Remove this rule when it's no longer needed.
  'Libraries/Relay/relay/tools/relayUnstableBatchedUpdates.js',
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

function escapeRegExp(pattern) {
  if (Object.prototype.toString.call(pattern) === '[object RegExp]') {
    return pattern.source.replace(/\//g, path.sep);
  } else if (typeof pattern === 'string') {
    var escaped = pattern.replace(/[\-\[\]\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    // convert the '/' into an escaped local file separator
    return escaped.replace(/\//g,'\\' + path.sep);
  } else {
    throw new Error('Unexpected packager blacklist pattern: ' + pattern);
  }
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
