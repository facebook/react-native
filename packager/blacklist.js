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
  'node_modules/react-tools/docs/js/react.js',
  'node_modules/react-tools/src/package.json',  

  // Those conflicts with the ones in react-tools/. We need to blacklist the
  // internal version otherwise they won't work in open source.
  'downstream/core/invariant.js',
  'downstream/key-mirror/keyMirror.js',
  'downstream/core/emptyFunction.js',
  'downstream/core/emptyObject.js',
  'downstream/key-mirror/keyOf.js',
  'downstream/core/dom/isNode.js',
  'downstream/core/TouchEventUtils.js',
  'downstream/core/nativeRequestAnimationFrame.js',
  'downstream/core/dom/containsNode.js',
  'downstream/core/dom/isTextNode.js',
  'downstream/functional/mapObject.js',
  'downstream/core/camelize.js',
  'downstream/core/hyphenate.js',
  'downstream/core/createArrayFromMixed.js',
  'downstream/core/toArray.js',
  'downstream/core/dom/getActiveElement.js',
  'downstream/core/dom/focusNode.js',
  'downstream/core/dom/getUnboundedScrollPosition.js',
  'downstream/core/createNodesFromMarkup.js',
  'downstream/core/CSSCore.js',
  'downstream/core/getMarkupWrap.js',
  'downstream/core/hyphenateStyleName.js',
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
