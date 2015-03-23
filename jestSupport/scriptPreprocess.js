/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var transformer = require('../packager/transformer.js');

function transformSource(src, filename) {
  return transformer.transform(src, filename).code;
}

module.exports = {
  transformSource: transformSource,

  process: function(src, fileName) {
    if (fileName.match(/node_modules/)) {
      return src;
    }

    try {
      return transformSource(src, fileName);
    } catch(e) {
      throw new Error('\nError transforming file:\n  js/' +
        (fileName.split('/js/')[1] || fileName) + ':' + e.lineNumber + ': \'' +
        e.message + '\'\n');
    }
  }
};
