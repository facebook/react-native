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
    try {
      return transformSource(src, fileName);
    } catch(e) {
      console.error('\nError transforming file:\n  js/' +
        (fileName.split('/js/')[1] || fileName) + ':' + e.lineNumber + ': \'' +
        e.message + '\'\n');
      return src;
    }
  }
};
