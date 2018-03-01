/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule buildStyleInterpolator
 */

'use strict';

var keyOf = require('fbjs/lib/keyOf');

var X_DIM = keyOf({x: null});
var Y_DIM = keyOf({y: null});
var Z_DIM = keyOf({z: null});

var InitialOperationField = {
  transformTranslate: [0, 0, 0],
  transformScale: [1, 1, 1],
};

var InterpolateMatrix = {
  transformScale: function(mat, x, y, z) {
    mat[0] = mat[0] * x;
    mat[1] = mat[1] * x;
    mat[2] = mat[2] * x;
    mat[3] = mat[3] * x;
    mat[4] = mat[4] * y;
    mat[5] = mat[5] * y;
    mat[6] = mat[6] * y;
    mat[7] = mat[7] * y;
    mat[8] = mat[8] * z;
    mat[9] = mat[9] * z;
    mat[10] = mat[10] * z;
    mat[11] = mat[11] * z;
  },
  transformTranslate: function(mat, x, y, z) {
    mat[12] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
    mat[13] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
    mat[14] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];
    mat[15] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15];
  }
};

var computeNextValLinear = function(anim, from, to, value) {
  var hasRoundRatio = 'round' in anim;
  var roundRatio = anim.round;
  var ratio = (value - anim.min) / (anim.max - anim.min);
  if (!anim.extrapolate) {
    ratio = ratio > 1 ? 1 : (ratio < 0 ? 0 : ratio);
  }
  var nextVal = from * (1 - ratio) + to * ratio;
  if (hasRoundRatio) {
    nextVal = Math.round(roundRatio * nextVal) / roundRatio;
  }
  return nextVal;
};

var computeNextValLinearScalar = function(anim, value) {
  return computeNextValLinear(anim, anim.from, anim.to, value);
};

var setNextValAndDetectChange = function(result, name, nextVal, didChange) {
  if (!didChange) {
    var prevVal = result[name];
    result[name] = nextVal;
    didChange = didChange  || (nextVal !== prevVal);
  } else {
    result[name] = nextVal;
  }
  return didChange;
};

var initIdentity = function(mat) {
  mat[0] = 1;
  mat[1] = 0;
  mat[2] = 0;
  mat[3] = 0;
  mat[4] = 0;
  mat[5] = 1;
  mat[6] = 0;
  mat[7] = 0;
  mat[8] = 0;
  mat[9] = 0;
  mat[10] = 1;
  mat[11] = 0;
  mat[12] = 0;
  mat[13] = 0;
  mat[14] = 0;
  mat[15] = 1;
};

var computeNextMatrixOperationField = function(anim, name, dim, index, value) {
  if (anim.from[dim] !== undefined && anim.to[dim] !== undefined) {
    return computeNextValLinear(anim, anim.from[dim], anim.to[dim], value);
  } else {
    return InitialOperationField[name][index];
  }
};

var computeTransform = function(anim, name, value, result,
                                didChange, didMatrix) {
  var transform = result.transform !== undefined ?
        result.transform : (result.transform = [{ matrix: [] }]);
  var mat = transform[0].matrix;
  var m0 = mat[0];
  var m1 = mat[1];
  var m2 = mat[2];
  var m3 = mat[3];
  var m4 = mat[4];
  var m5 = mat[5];
  var m6 = mat[6];
  var m7 = mat[7];
  var m8 = mat[8];
  var m9 = mat[9];
  var m10 = mat[10];
  var m11 = mat[11];
  var m12 = mat[12];
  var m13 = mat[13];
  var m14 = mat[14];
  var m15 = mat[15];
  if (!didMatrix) {
    initIdentity(mat);  // This will be the first transform.
  }
  var x = computeNextMatrixOperationField(anim, name, X_DIM, 0, value);
  var y = computeNextMatrixOperationField(anim, name, Y_DIM, 1, value);
  var z = computeNextMatrixOperationField(anim, name, Z_DIM, 2, value);
  InterpolateMatrix[name](mat, x, y, z);
  if (!didChange) {
    didChange = m0 !== mat[0] || m1 !== mat[1] ||
                m2 !== mat[2] || m3 !== mat[3] ||
                m4 !== mat[4] || m5 !== mat[5] ||
                m6 !== mat[6] || m7 !== mat[7] ||
                m8 !== mat[8] || m9 !== mat[9] ||
                m10 !== mat[10] || m11 !== mat[11] ||
                m12 !== mat[12] || m13 !== mat[13] ||
                m14 !== mat[14] || m15 !== mat[15];
  }
  return didChange;
};

/**
 * @param {object} anims Animation configuration by style property name.
 * @return {function} Function accepting style object, that mutates that style
 * object and returns a boolean describing if any update was actually applied.
 */
var buildStyleInterpolator = function(anims) {
  function styleInterpolator(result, value) {
    var didChange = false;
    var didMatrix = false;
    for (var name in anims) {
      var anim = anims[name];
      if (anim.type === 'linear') {
        if (name in InterpolateMatrix) {
          didChange = computeTransform(anim, name, value, result,
                                       didChange, didMatrix);
          didMatrix = true;
        } else {
          var next = computeNextValLinearScalar(anim, value);
          didChange = setNextValAndDetectChange(result, name, next, didChange);
        }
      } else if (anim.type === 'constant') {
        var next = anim.value;
        didChange = setNextValAndDetectChange(result, name, next, didChange);
      } else if (anim.type === 'step') {
        var next = value >= anim.threshold ? anim.to : anim.from;
        didChange = setNextValAndDetectChange(result, name, next, didChange);
      } else if (anim.type === 'identity') {
        var next = value;
        didChange = setNextValAndDetectChange(result, name, next, didChange);
      }
    }
    return didChange;
  }
  return styleInterpolator;
};

module.exports = buildStyleInterpolator;
