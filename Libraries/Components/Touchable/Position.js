/**
 * @providesModule Position
 */

"use strict";

var PooledClass = require('PooledClass');

var twoArgumentPooler = PooledClass.twoArgumentPooler;

/**
 * Position does not expose methods for construction via an `HTMLDOMElement`,
 * because it isn't meaningful to construct such a thing without first defining
 * a frame of refrence.
 *
 * @param {number} windowStartKey Key that window starts at.
 * @param {number} windowEndKey Key that window ends at.
 */
function Position(left, top) {
  this.left = left;
  this.top = top;
}

PooledClass.addPoolingTo(Position, twoArgumentPooler);

module.exports = Position;

