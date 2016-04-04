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
var resolvePlugins = require('../lib/resolvePlugins');

var hmrTransform = 'react-transform-hmr/lib/index.js';
var transformPath = require.resolve(hmrTransform);

module.exports = function(options, filename) {
  var transform = filename
      ? './' + path.relative(path.dirname(filename), transformPath) // packager can't handle absolute paths
      : hmrTransform;
  return {
    plugins: resolvePlugins([
      [
        'react-transform',
        {
          transforms: [{
            transform: transform,
            imports: ['react-native/Libraries/react-native/react-native.js'],
            locals: ['module'],
          }]
        },
      ]
    ])
  };
};
