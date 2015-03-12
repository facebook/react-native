/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */
'use strict';

// Don't forget to everything listed here to `testConfig.json`
// modulePathIgnorePatterns.
var sharedBlacklist = [
  __dirname,
  'node_modules/parse/node_modules/xmlhttprequest/lib/XMLHttpRequest.js',
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
