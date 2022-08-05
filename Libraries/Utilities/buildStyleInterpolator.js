/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const X_DIM = 'x';
const Y_DIM = 'y';
const Z_DIM = 'z';

const InitialOperationField = {
  transformTranslate: [0, 0, 0],
  transformScale: [1, 1, 1],
};

const InterpolateMatrix = {
  transformScale: function (mat, x, y, z) {
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
  transformTranslate: function (mat, x, y, z) {
    mat[12] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12];
    mat[13] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13];
    mat[14] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14];
    mat[15] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15];
  },
};

const computeNextValLinear = function (anim, from, to, value) {
  const hasRoundRatio = 'round' in anim;
  const roundRatio = anim.round;
  let ratio = (value - anim.min) / (anim.max - anim.min);
  if (!anim.extrapolate) {
    ratio = ratio > 1 ? 1 : ratio < 0 ? 0 : ratio;
  }
  let nextVal = from * (1 - ratio) + to * ratio;
  if (hasRoundRatio) {
    nextVal = Math.round(roundRatio * nextVal) / roundRatio;
  }
  if (!isFinite(nextVal)) {
    nextVal = null;
  }
  return nextVal;
};

const computeNextValLinearScalar = function (anim, value) {
  return computeNextValLinear(anim, anim.from, anim.to, value);
};

const setNextValAndDetectChange = function (result, name, nextVal, didChange) {
  if (!didChange) {
    const prevVal = result[name];
    result[name] = nextVal;
    didChange = didChange || nextVal !== prevVal;
  } else {
    result[name] = nextVal;
  }
  return didChange;
};

const initIdentity = function (mat) {
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

const computeNextMatrixOperationField = function (
  anim,
  name,
  dim,
  index,
  value,
) {
  if (anim.from[dim] !== undefined && anim.to[dim] !== undefined) {
    return computeNextValLinear(anim, anim.from[dim], anim.to[dim], value);
  } else {
    return InitialOperationField[name][index];
  }
};

const computeTransform = function (
  anim,
  name,
  value,
  result,
  didChange,
  didMatrix,
) {
  const transform =
    result.transform !== undefined
      ? result.transform
      : (result.transform = [{matrix: []}]);
  const mat = transform[0].matrix;
  const m0 = mat[0];
  const m1 = mat[1];
  const m2 = mat[2];
  const m3 = mat[3];
  const m4 = mat[4];
  const m5 = mat[5];
  const m6 = mat[6];
  const m7 = mat[7];
  const m8 = mat[8];
  const m9 = mat[9];
  const m10 = mat[10];
  const m11 = mat[11];
  const m12 = mat[12];
  const m13 = mat[13];
  const m14 = mat[14];
  const m15 = mat[15];
  if (!didMatrix) {
    initIdentity(mat); // This will be the first transform.
  }
  const x = computeNextMatrixOperationField(anim, name, X_DIM, 0, value);
  const y = computeNextMatrixOperationField(anim, name, Y_DIM, 1, value);
  const z = computeNextMatrixOperationField(anim, name, Z_DIM, 2, value);
  InterpolateMatrix[name](mat, x, y, z);
  if (!didChange) {
    didChange =
      m0 !== mat[0] ||
      m1 !== mat[1] ||
      m2 !== mat[2] ||
      m3 !== mat[3] ||
      m4 !== mat[4] ||
      m5 !== mat[5] ||
      m6 !== mat[6] ||
      m7 !== mat[7] ||
      m8 !== mat[8] ||
      m9 !== mat[9] ||
      m10 !== mat[10] ||
      m11 !== mat[11] ||
      m12 !== mat[12] ||
      m13 !== mat[13] ||
      m14 !== mat[14] ||
      m15 !== mat[15];
  }
  return didChange;
};

/**
 * @param {object} anims Animation configuration by style property name.
 * @return {function} Function accepting style object, that mutates that style
 * object and returns a boolean describing if any update was actually applied.
 */
const buildStyleInterpolator = function (anims) {
  function styleInterpolator(result, value) {
    let didChange = false;
    let didMatrix = false;
    for (const name in anims) {
      const anim = anims[name];
      if (anim.type === 'linear') {
        if (name in InterpolateMatrix) {
          didChange = computeTransform(
            anim,
            name,
            value,
            result,
            didChange,
            didMatrix,
          );
          didMatrix = true;
        } else {
          const next = computeNextValLinearScalar(anim, value);
          didChange = setNextValAndDetectChange(result, name, next, didChange);
        }
      } else if (anim.type === 'constant') {
        const next = anim.value;
        didChange = setNextValAndDetectChange(result, name, next, didChange);
      } else if (anim.type === 'step') {
        const next = value >= anim.threshold ? anim.to : anim.from;
        didChange = setNextValAndDetectChange(result, name, next, didChange);
      } else if (anim.type === 'identity') {
        const next = value;
        didChange = setNextValAndDetectChange(result, name, next, didChange);
      }
    }
    return didChange;
  }
  return styleInterpolator;
};

module.exports = buildStyleInterpolator;
