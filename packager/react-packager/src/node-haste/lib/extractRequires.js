/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const replacePatterns = require('./replacePatterns');

/**
 * Extract all required modules from a `code` string.
 */
const blockCommentRe = /\/\*[^]*?\*\//g;
const lineCommentRe = /\/\/.*/g;
function extractRequires(code) {
  const cache = Object.create(null);
  var deps = {
    sync: [],
  };

  const addDependency = (dep) => {
    if (!cache[dep]) {
      cache[dep] = true;
      deps.sync.push(dep);
    }
  };

  code = code
    .replace(blockCommentRe, '')
    .replace(lineCommentRe, '')
    // Parse the sync dependencies this module has. When the module is
    // required, all it's sync dependencies will be loaded into memory.
    // Sync dependencies can be defined either using `require` or the ES6
    // `import` or `export` syntaxes:
    //   var dep1 = require('dep1');
    .replace(replacePatterns.IMPORT_RE, (match, pre, quot, dep, post) => {
      addDependency(dep);
      return match;
    })
    .replace(replacePatterns.EXPORT_RE, (match, pre, quot, dep, post) => {
      addDependency(dep);
      return match;
    })
    .replace(replacePatterns.REQUIRE_RE, (match, pre, quot, dep, post) => {
      addDependency(dep);
      return match;
    });

  return {code, deps};
}

module.exports = extractRequires;
