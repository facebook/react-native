/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BoundingDimensions
 */

'use strict';

var PooledClass = require('react/lib/PooledClass');

var twoArgumentPooler = PooledClass.twoArgumentPooler;

/**
 * PooledClass representing the bounding rectangle of a region.
 *
 * @param {number} width Width of bounding rectangle.
 * @param {number} height Height of bounding rectangle.
 * @constructor BoundingDimensions
 */
function BoundingDimensions(width, height) {
  this.width = width;
  this.height = height;
}

BoundingDimensions.prototype.destructor = function() {
  this.width = null;
  this.height = null;
};

/**
 * @param {HTMLElement} element Element to return `BoundingDimensions` for.
 * @return {BoundingDimensions} Bounding dimensions of `element`.
 */
BoundingDimensions.getPooledFromElement = function(element) {
  return BoundingDimensions.getPooled(
    element.offsetWidth,
    element.offsetHeight
  );
};

PooledClass.addPoolingTo(BoundingDimensions, twoArgumentPooler);

module.exports = BoundingDimensions;
