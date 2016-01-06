/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

exports.getAll = function(options) {
  var plugins = [];
  if (options.hot) {
    plugins = plugins.concat([
      [
        'react-transform',
        {
          transforms: [{
            transform: 'react-transform-hmr/lib/index.js',
            imports: ['React'],
            locals: ['module'],
          }]
        },
      ],
      'transform-es2015-block-scoping',
      'transform-es2015-constants',
      ['transform-es2015-modules-commonjs', {strict: false, allowTopLevelThis: true}],
    ]);
  }

  return plugins;
};

