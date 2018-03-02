/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ARTSerializablePath
 */
'use strict';

// TODO: Move this into an ART mode called "serialized" or something

var Class = require('art/core/class.js');
var Path = require('art/core/path.js');

var MOVE_TO = 0;
var CLOSE = 1;
var LINE_TO = 2;
var CURVE_TO = 3;
var ARC = 4;

var SerializablePath = Class(Path, {

  initialize: function(path) {
    this.reset();
    if (path instanceof SerializablePath) {
      this.path = path.path.slice(0);
    } else if (path) {
      if (path.applyToPath) {
        path.applyToPath(this);
      } else {
        this.push(path);
      }
    }
  },

  onReset: function() {
    this.path = [];
  },

  onMove: function(sx, sy, x, y) {
    this.path.push(MOVE_TO, x, y);
  },

  onLine: function(sx, sy, x, y) {
    this.path.push(LINE_TO, x, y);
  },

  onBezierCurve: function(sx, sy, p1x, p1y, p2x, p2y, x, y) {
    this.path.push(CURVE_TO, p1x, p1y, p2x, p2y, x, y);
  },

  _arcToBezier: Path.prototype.onArc,

  onArc: function(sx, sy, ex, ey, cx, cy, rx, ry, sa, ea, ccw, rotation) {
    if (rx !== ry || rotation) {
      return this._arcToBezier(
        sx, sy, ex, ey, cx, cy, rx, ry, sa, ea, ccw, rotation
      );
    }
    this.path.push(ARC, cx, cy, rx, sa, ea, ccw ? 0 : 1);
  },

  onClose: function() {
    this.path.push(CLOSE);
  },

  toJSON: function() {
    return this.path;
  }

});

module.exports = SerializablePath;
