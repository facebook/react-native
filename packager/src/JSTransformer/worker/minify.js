/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const uglify = require('uglify-js');

const {UGLIFY_JS_OUTPUT_OPTIONS} = require('./JsMinification');

import type {MappingsMap} from '../../lib/SourceMap';

function minify(filename: string, inputCode: string, sourceMap: ?MappingsMap) {
  const result = uglify.minify(inputCode, {
    fromString: true,
    inSourceMap: sourceMap,
    outSourceMap: true,
    output: UGLIFY_JS_OUTPUT_OPTIONS,
  });

  const code = result.code;
  const map = JSON.parse(result.map);
  map.sources = [filename];
  return {code, map};
}

module.exports = minify;
