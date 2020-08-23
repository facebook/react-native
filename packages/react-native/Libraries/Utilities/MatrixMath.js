/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const invariant = require('invariant');

/**
 * Memory conservative (mutative) matrix math utilities. Uses "command"
 * matrices, which are reusable.
 */
const MatrixMath = {
  createIdentityMatrix: function() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  },

  createCopy: function(m) {
    return [
      m[0],
      m[1],
      m[2],
      m[3],
      m[4],
      m[5],
      m[6],
      m[7],
      m[8],
      m[9],
      m[10],
      m[11],
      m[12],
      m[13],
      m[14],
      m[15],
    ];
  },

  createOrthographic: function(left, right, bottom, top, near, far) {
    const a = 2 / (right - left);
    const b = 2 / (top - bottom);
    const c = -2 / (far - near);

    const tx = -(right + left) / (right - left);
    const ty = -(top + bottom) / (top - bottom);
    const tz = -(far + near) / (far - near);

    return [a, 0, 0, 0, 0, b, 0, 0, 0, 0, c, 0, tx, ty, tz, 1];
  },

  createFrustum: function(left, right, bottom, top, near, far) {
    const r_width = 1 / (right - left);
    const r_height = 1 / (top - bottom);
    const r_depth = 1 / (near - far);
    const x = 2 * (near * r_width);
    const y = 2 * (near * r_height);
    const A = (right + left) * r_width;
    const B = (top + bottom) * r_height;
    const C = (far + near) * r_depth;
    const D = 2 * (far * near * r_depth);
    return [x, 0, 0, 0, 0, y, 0, 0, A, B, C, -1, 0, 0, D, 0];
  },

  /**
   * This create a perspective projection towards negative z
   * Clipping the z range of [-near, -far]
   *
   * @param fovInRadians - field of view in randians
   */
  createPerspective: function(fovInRadians, aspect, near, far) {
    const h = 1 / Math.tan(fovInRadians / 2);
    const r_depth = 1 / (near - far);
    const C = (far + near) * r_depth;
    const D = 2 * (far * near * r_depth);
    return [h / aspect, 0, 0, 0, 0, h, 0, 0, 0, 0, C, -1, 0, 0, D, 0];
  },

  createTranslate2d: function(x, y) {
    const mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseTranslate2dCommand(mat, x, y);
    return mat;
  },

  reuseTranslate2dCommand: function(matrixCommand, x, y) {
    matrixCommand[12] = x;
    matrixCommand[13] = y;
  },

  reuseTranslate3dCommand: function(matrixCommand, x, y, z) {
    matrixCommand[12] = x;
    matrixCommand[13] = y;
    matrixCommand[14] = z;
  },

  createScale: function(factor) {
    const mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseScaleCommand(mat, factor);
    return mat;
  },

  reuseScaleCommand: function(matrixCommand, factor) {
    matrixCommand[0] = factor;
    matrixCommand[5] = factor;
  },

  reuseScale3dCommand: function(matrixCommand, x, y, z) {
    matrixCommand[0] = x;
    matrixCommand[5] = y;
    matrixCommand[10] = z;
  },

  reusePerspectiveCommand: function(matrixCommand, p) {
    matrixCommand[11] = -1 / p;
  },

  reuseScaleXCommand(matrixCommand, factor) {
    matrixCommand[0] = factor;
  },

  reuseScaleYCommand(matrixCommand, factor) {
    matrixCommand[5] = factor;
  },

  reuseScaleZCommand(matrixCommand, factor) {
    matrixCommand[10] = factor;
  },

  reuseRotateXCommand: function(matrixCommand, radians) {
    matrixCommand[5] = Math.cos(radians);
    matrixCommand[6] = Math.sin(radians);
    matrixCommand[9] = -Math.sin(radians);
    matrixCommand[10] = Math.cos(radians);
  },

  reuseRotateYCommand: function(matrixCommand, amount) {
    matrixCommand[0] = Math.cos(amount);
    matrixCommand[2] = -Math.sin(amount);
    matrixCommand[8] = Math.sin(amount);
    matrixCommand[10] = Math.cos(amount);
  },

  // http://www.w3.org/TR/css3-transforms/#recomposing-to-a-2d-matrix
  reuseRotateZCommand: function(matrixCommand, radians) {
    matrixCommand[0] = Math.cos(radians);
    matrixCommand[1] = Math.sin(radians);
    matrixCommand[4] = -Math.sin(radians);
    matrixCommand[5] = Math.cos(radians);
  },

  createRotateZ: function(radians) {
    const mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseRotateZCommand(mat, radians);
    return mat;
  },

  reuseSkewXCommand: function(matrixCommand, radians) {
    matrixCommand[4] = Math.tan(radians);
  },

  reuseSkewYCommand: function(matrixCommand, radians) {
    matrixCommand[1] = Math.tan(radians);
  },

  multiplyInto: function(out, a, b) {
    const a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3],
      a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7],
      a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11],
      a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];

    let b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  },

  determinant(matrix: Array<number>): number {
    const [
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33,
    ] = matrix;
    return (
      m03 * m12 * m21 * m30 -
      m02 * m13 * m21 * m30 -
      m03 * m11 * m22 * m30 +
      m01 * m13 * m22 * m30 +
      m02 * m11 * m23 * m30 -
      m01 * m12 * m23 * m30 -
      m03 * m12 * m20 * m31 +
      m02 * m13 * m20 * m31 +
      m03 * m10 * m22 * m31 -
      m00 * m13 * m22 * m31 -
      m02 * m10 * m23 * m31 +
      m00 * m12 * m23 * m31 +
      m03 * m11 * m20 * m32 -
      m01 * m13 * m20 * m32 -
      m03 * m10 * m21 * m32 +
      m00 * m13 * m21 * m32 +
      m01 * m10 * m23 * m32 -
      m00 * m11 * m23 * m32 -
      m02 * m11 * m20 * m33 +
      m01 * m12 * m20 * m33 +
      m02 * m10 * m21 * m33 -
      m00 * m12 * m21 * m33 -
      m01 * m10 * m22 * m33 +
      m00 * m11 * m22 * m33
    );
  },

  /**
   * Inverse of a matrix. Multiplying by the inverse is used in matrix math
   * instead of division.
   *
   * Formula from:
   * http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
   */
  inverse(matrix: Array<number>): Array<number> {
    const det = MatrixMath.determinant(matrix);
    if (!det) {
      return matrix;
    }
    const [
      m00,
      m01,
      m02,
      m03,
      m10,
      m11,
      m12,
      m13,
      m20,
      m21,
      m22,
      m23,
      m30,
      m31,
      m32,
      m33,
    ] = matrix;
    return [
      (m12 * m23 * m31 -
        m13 * m22 * m31 +
        m13 * m21 * m32 -
        m11 * m23 * m32 -
        m12 * m21 * m33 +
        m11 * m22 * m33) /
        det,
      (m03 * m22 * m31 -
        m02 * m23 * m31 -
        m03 * m21 * m32 +
        m01 * m23 * m32 +
        m02 * m21 * m33 -
        m01 * m22 * m33) /
        det,
      (m02 * m13 * m31 -
        m03 * m12 * m31 +
        m03 * m11 * m32 -
        m01 * m13 * m32 -
        m02 * m11 * m33 +
        m01 * m12 * m33) /
        det,
      (m03 * m12 * m21 -
        m02 * m13 * m21 -
        m03 * m11 * m22 +
        m01 * m13 * m22 +
        m02 * m11 * m23 -
        m01 * m12 * m23) /
        det,
      (m13 * m22 * m30 -
        m12 * m23 * m30 -
        m13 * m20 * m32 +
        m10 * m23 * m32 +
        m12 * m20 * m33 -
        m10 * m22 * m33) /
        det,
      (m02 * m23 * m30 -
        m03 * m22 * m30 +
        m03 * m20 * m32 -
        m00 * m23 * m32 -
        m02 * m20 * m33 +
        m00 * m22 * m33) /
        det,
      (m03 * m12 * m30 -
        m02 * m13 * m30 -
        m03 * m10 * m32 +
        m00 * m13 * m32 +
        m02 * m10 * m33 -
        m00 * m12 * m33) /
        det,
      (m02 * m13 * m20 -
        m03 * m12 * m20 +
        m03 * m10 * m22 -
        m00 * m13 * m22 -
        m02 * m10 * m23 +
        m00 * m12 * m23) /
        det,
      (m11 * m23 * m30 -
        m13 * m21 * m30 +
        m13 * m20 * m31 -
        m10 * m23 * m31 -
        m11 * m20 * m33 +
        m10 * m21 * m33) /
        det,
      (m03 * m21 * m30 -
        m01 * m23 * m30 -
        m03 * m20 * m31 +
        m00 * m23 * m31 +
        m01 * m20 * m33 -
        m00 * m21 * m33) /
        det,
      (m01 * m13 * m30 -
        m03 * m11 * m30 +
        m03 * m10 * m31 -
        m00 * m13 * m31 -
        m01 * m10 * m33 +
        m00 * m11 * m33) /
        det,
      (m03 * m11 * m20 -
        m01 * m13 * m20 -
        m03 * m10 * m21 +
        m00 * m13 * m21 +
        m01 * m10 * m23 -
        m00 * m11 * m23) /
        det,
      (m12 * m21 * m30 -
        m11 * m22 * m30 -
        m12 * m20 * m31 +
        m10 * m22 * m31 +
        m11 * m20 * m32 -
        m10 * m21 * m32) /
        det,
      (m01 * m22 * m30 -
        m02 * m21 * m30 +
        m02 * m20 * m31 -
        m00 * m22 * m31 -
        m01 * m20 * m32 +
        m00 * m21 * m32) /
        det,
      (m02 * m11 * m30 -
        m01 * m12 * m30 -
        m02 * m10 * m31 +
        m00 * m12 * m31 +
        m01 * m10 * m32 -
        m00 * m11 * m32) /
        det,
      (m01 * m12 * m20 -
        m02 * m11 * m20 +
        m02 * m10 * m21 -
        m00 * m12 * m21 -
        m01 * m10 * m22 +
        m00 * m11 * m22) /
        det,
    ];
  },

  /**
   * Turns columns into rows and rows into columns.
   */
  transpose(m: Array<number>): Array<number> {
    return [
      m[0],
      m[4],
      m[8],
      m[12],
      m[1],
      m[5],
      m[9],
      m[13],
      m[2],
      m[6],
      m[10],
      m[14],
      m[3],
      m[7],
      m[11],
      m[15],
    ];
  },

  /**
   * Based on: http://tog.acm.org/resources/GraphicsGems/gemsii/unmatrix.c
   */
  multiplyVectorByMatrix(v: Array<number>, m: Array<number>): Array<number> {
    const [vx, vy, vz, vw] = v;
    return [
      vx * m[0] + vy * m[4] + vz * m[8] + vw * m[12],
      vx * m[1] + vy * m[5] + vz * m[9] + vw * m[13],
      vx * m[2] + vy * m[6] + vz * m[10] + vw * m[14],
      vx * m[3] + vy * m[7] + vz * m[11] + vw * m[15],
    ];
  },

  /**
   * From: https://code.google.com/p/webgl-mjs/source/browse/mjs.js
   */
  v3Length(a: Array<number>): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  },

  /**
   * Based on: https://code.google.com/p/webgl-mjs/source/browse/mjs.js
   */
  v3Normalize(vector: Array<number>, v3Length: number): Array<number> {
    const im = 1 / (v3Length || MatrixMath.v3Length(vector));
    return [vector[0] * im, vector[1] * im, vector[2] * im];
  },

  /**
   * The dot product of a and b, two 3-element vectors.
   * From: https://code.google.com/p/webgl-mjs/source/browse/mjs.js
   */
  v3Dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },

  /**
   * From:
   * http://www.opensource.apple.com/source/WebCore/WebCore-514/platform/graphics/transforms/TransformationMatrix.cpp
   */
  v3Combine(
    a: Array<number>,
    b: Array<number>,
    aScale: number,
    bScale: number,
  ): Array<number> {
    return [
      aScale * a[0] + bScale * b[0],
      aScale * a[1] + bScale * b[1],
      aScale * a[2] + bScale * b[2],
    ];
  },

  /**
   * From:
   * http://www.opensource.apple.com/source/WebCore/WebCore-514/platform/graphics/transforms/TransformationMatrix.cpp
   */
  v3Cross(a: Array<number>, b: Array<number>): Array<number> {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  },

  /**
   * Based on:
   * http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToEuler/
   * and:
   * http://quat.zachbennett.com/
   *
   * Note that this rounds degrees to the thousandth of a degree, due to
   * floating point errors in the creation of the quaternion.
   *
   * Also note that this expects the qw value to be last, not first.
   *
   * Also, when researching this, remember that:
   * yaw   === heading            === z-axis
   * pitch === elevation/attitude === y-axis
   * roll  === bank               === x-axis
   */
  quaternionToDegreesXYZ(q: Array<number>, matrix, row): Array<number> {
    const [qx, qy, qz, qw] = q;
    const qw2 = qw * qw;
    const qx2 = qx * qx;
    const qy2 = qy * qy;
    const qz2 = qz * qz;
    const test = qx * qy + qz * qw;
    const unit = qw2 + qx2 + qy2 + qz2;
    const conv = 180 / Math.PI;

    if (test > 0.49999 * unit) {
      return [0, 2 * Math.atan2(qx, qw) * conv, 90];
    }
    if (test < -0.49999 * unit) {
      return [0, -2 * Math.atan2(qx, qw) * conv, -90];
    }

    return [
      MatrixMath.roundTo3Places(
        Math.atan2(2 * qx * qw - 2 * qy * qz, 1 - 2 * qx2 - 2 * qz2) * conv,
      ),
      MatrixMath.roundTo3Places(
        Math.atan2(2 * qy * qw - 2 * qx * qz, 1 - 2 * qy2 - 2 * qz2) * conv,
      ),
      MatrixMath.roundTo3Places(Math.asin(2 * qx * qy + 2 * qz * qw) * conv),
    ];
  },

  /**
   * Based on:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
   */
  roundTo3Places(n: number): number {
    const arr = n.toString().split('e');
    return Math.round(arr[0] + 'e' + (arr[1] ? +arr[1] - 3 : 3)) * 0.001;
  },

  /**
   * Decompose a matrix into separate transform values, for use on platforms
   * where applying a precomposed matrix is not possible, and transforms are
   * applied in an inflexible ordering (e.g. Android).
   *
   * Implementation based on
   * http://www.w3.org/TR/css3-transforms/#decomposing-a-2d-matrix
   * http://www.w3.org/TR/css3-transforms/#decomposing-a-3d-matrix
   * which was based on
   * http://tog.acm.org/resources/GraphicsGems/gemsii/unmatrix.c
   */
  decomposeMatrix(transformMatrix: Array<number>): ?Object {
    invariant(
      transformMatrix.length === 16,
      'Matrix decomposition needs a list of 3d matrix values, received %s',
      transformMatrix,
    );

    // output values
    let perspective = [];
    const quaternion = [];
    const scale = [];
    const skew = [];
    const translation = [];

    // create normalized, 2d array matrix
    // and normalized 1d array perspectiveMatrix with redefined 4th column
    if (!transformMatrix[15]) {
      return;
    }
    const matrix = [];
    const perspectiveMatrix = [];
    for (let i = 0; i < 4; i++) {
      matrix.push([]);
      for (let j = 0; j < 4; j++) {
        const value = transformMatrix[i * 4 + j] / transformMatrix[15];
        matrix[i].push(value);
        perspectiveMatrix.push(j === 3 ? 0 : value);
      }
    }
    perspectiveMatrix[15] = 1;

    // test for singularity of upper 3x3 part of the perspective matrix
    if (!MatrixMath.determinant(perspectiveMatrix)) {
      return;
    }

    // isolate perspective
    if (matrix[0][3] !== 0 || matrix[1][3] !== 0 || matrix[2][3] !== 0) {
      // rightHandSide is the right hand side of the equation.
      // rightHandSide is a vector, or point in 3d space relative to the origin.
      const rightHandSide = [
        matrix[0][3],
        matrix[1][3],
        matrix[2][3],
        matrix[3][3],
      ];

      // Solve the equation by inverting perspectiveMatrix and multiplying
      // rightHandSide by the inverse.
      const inversePerspectiveMatrix = MatrixMath.inverse(perspectiveMatrix);
      const transposedInversePerspectiveMatrix = MatrixMath.transpose(
        inversePerspectiveMatrix,
      );
      perspective = MatrixMath.multiplyVectorByMatrix(
        rightHandSide,
        transposedInversePerspectiveMatrix,
      );
    } else {
      // no perspective
      perspective[0] = perspective[1] = perspective[2] = 0;
      perspective[3] = 1;
    }

    // translation is simple
    for (let i = 0; i < 3; i++) {
      translation[i] = matrix[3][i];
    }

    // Now get scale and shear.
    // 'row' is a 3 element array of 3 component vectors
    const row = [];
    for (let i = 0; i < 3; i++) {
      row[i] = [matrix[i][0], matrix[i][1], matrix[i][2]];
    }

    // Compute X scale factor and normalize first row.
    scale[0] = MatrixMath.v3Length(row[0]);
    row[0] = MatrixMath.v3Normalize(row[0], scale[0]);

    // Compute XY shear factor and make 2nd row orthogonal to 1st.
    skew[0] = MatrixMath.v3Dot(row[0], row[1]);
    row[1] = MatrixMath.v3Combine(row[1], row[0], 1.0, -skew[0]);

    // Now, compute Y scale and normalize 2nd row.
    scale[1] = MatrixMath.v3Length(row[1]);
    row[1] = MatrixMath.v3Normalize(row[1], scale[1]);
    skew[0] /= scale[1];

    // Compute XZ and YZ shears, orthogonalize 3rd row
    skew[1] = MatrixMath.v3Dot(row[0], row[2]);
    row[2] = MatrixMath.v3Combine(row[2], row[0], 1.0, -skew[1]);
    skew[2] = MatrixMath.v3Dot(row[1], row[2]);
    row[2] = MatrixMath.v3Combine(row[2], row[1], 1.0, -skew[2]);

    // Next, get Z scale and normalize 3rd row.
    scale[2] = MatrixMath.v3Length(row[2]);
    row[2] = MatrixMath.v3Normalize(row[2], scale[2]);
    skew[1] /= scale[2];
    skew[2] /= scale[2];

    // At this point, the matrix (in rows) is orthonormal.
    // Check for a coordinate system flip.  If the determinant
    // is -1, then negate the matrix and the scaling factors.
    const pdum3 = MatrixMath.v3Cross(row[1], row[2]);
    if (MatrixMath.v3Dot(row[0], pdum3) < 0) {
      for (let i = 0; i < 3; i++) {
        scale[i] *= -1;
        row[i][0] *= -1;
        row[i][1] *= -1;
        row[i][2] *= -1;
      }
    }

    // Now, get the rotations out
    quaternion[0] =
      0.5 * Math.sqrt(Math.max(1 + row[0][0] - row[1][1] - row[2][2], 0));
    quaternion[1] =
      0.5 * Math.sqrt(Math.max(1 - row[0][0] + row[1][1] - row[2][2], 0));
    quaternion[2] =
      0.5 * Math.sqrt(Math.max(1 - row[0][0] - row[1][1] + row[2][2], 0));
    quaternion[3] =
      0.5 * Math.sqrt(Math.max(1 + row[0][0] + row[1][1] + row[2][2], 0));

    if (row[2][1] > row[1][2]) {
      quaternion[0] = -quaternion[0];
    }
    if (row[0][2] > row[2][0]) {
      quaternion[1] = -quaternion[1];
    }
    if (row[1][0] > row[0][1]) {
      quaternion[2] = -quaternion[2];
    }

    // correct for occasional, weird Euler synonyms for 2d rotation
    let rotationDegrees;
    if (
      quaternion[0] < 0.001 &&
      quaternion[0] >= 0 &&
      quaternion[1] < 0.001 &&
      quaternion[1] >= 0
    ) {
      // this is a 2d rotation on the z-axis
      rotationDegrees = [
        0,
        0,
        MatrixMath.roundTo3Places(
          (Math.atan2(row[0][1], row[0][0]) * 180) / Math.PI,
        ),
      ];
    } else {
      rotationDegrees = MatrixMath.quaternionToDegreesXYZ(
        quaternion,
        matrix,
        row,
      );
    }

    // expose both base data and convenience names
    return {
      rotationDegrees,
      perspective,
      quaternion,
      scale,
      skew,
      translation,

      rotate: rotationDegrees[2],
      rotateX: rotationDegrees[0],
      rotateY: rotationDegrees[1],
      scaleX: scale[0],
      scaleY: scale[1],
      translateX: translation[0],
      translateY: translation[1],
    };
  },
};

module.exports = MatrixMath;
