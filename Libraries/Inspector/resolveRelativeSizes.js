/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Dimensions = require('Dimensions');

/**
 * Resolves relative sizes (percentages and auto) in a style object.
 */
function resolveRelativeSizes(style: Object) {
  resolveSize(style, 'top', 'height');
  resolveSize(style, 'right', 'width');
  resolveSize(style, 'bottom', 'height');
  resolveSize(style, 'left', 'width');
}

function resolveSize(style, direction, dimension) {
  if (style[direction] !== null && typeof style[direction] === 'string') {
    if (style[direction].indexOf('%') !== -1) {
      style[direction] =
        (parseFloat(style[direction]) / 100.0) *
        Dimensions.get('window')[dimension];
    }
    if (style[direction] === 'auto') {
      // Ignore auto sizing in frame drawing due to complexity of correctly rendering this
      style[direction] = 0;
    }
  }
}

module.exports = resolveRelativeSizes;
