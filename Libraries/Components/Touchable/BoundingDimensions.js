/**
 * @providesModule BoundingDimensions
 */

"use strict";

var PooledClass = require('PooledClass');

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

