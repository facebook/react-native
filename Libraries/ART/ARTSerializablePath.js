/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

// TODO: Move this into an ART mode called "serialized" or something

const Class = require('art/core/class.js');
const Path = require('art/core/path.js');

const MOVE_TO = 0;
const CLOSE = 1;
const LINE_TO = 2;
const CURVE_TO = 3;
const ARC = 4;

const SerializablePath = Class(Path, {
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
        sx,
        sy,
        ex,
        ey,
        cx,
        cy,
        rx,
        ry,
        sa,
        ea,
        ccw,
        rotation,
      );
    }
    this.path.push(ARC, cx, cy, rx, sa, ea, ccw ? 0 : 1);
  },

  onClose: function() {
    this.path.push(CLOSE);
  },

  toJSON: function() {
    return this.path;
  },
});

module.exports = SerializablePath;
