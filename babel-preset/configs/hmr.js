/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
'use strict';

var path = require('path');

var hmrTransform = 'react-transform-hmr/lib/index.js';
var transformPath = require.resolve(hmrTransform);

module.exports = function(options, filename) {
  var transform = filename
    ? './' + path.relative(path.dirname(filename), transformPath) // packager can't handle absolute paths
    : hmrTransform;

  // Fix the module path to use '/' on Windows.
  if (path.sep === '\\') {
    transform = transform.replace(/\\/g, '/');
  }

  return {
    plugins: [
      [
        require('metro-babel7-plugin-react-transform'),
        {
          transforms: [
            {
              transform: transform,
              imports: ['react'],
              locals: ['module'],
            },
          ],
        },
      ],
    ],
  };
};
