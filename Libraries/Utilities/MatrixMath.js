/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule MatrixMath
 */
'use strict';

/**
 * Memory conservative (mutative) matrix math utilities. Uses "command"
 * matrices, which are reusable.
 */
var MatrixMath = {
  createIdentityMatrix: function() {
    return [
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1
    ];
  },

  createCopy: function(m) {
    return [
      m[0],  m[1],  m[2],  m[3],
      m[4],  m[5],  m[6],  m[7],
      m[8],  m[9],  m[10], m[11],
      m[12], m[13], m[14], m[15],
    ];
  },

  createTranslate2d: function(x, y) {
    var mat = MatrixMath.createIdentityMatrix();
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
    var mat = MatrixMath.createIdentityMatrix();
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

  reuseScaleXCommand(matrixCommand, factor) {
    matrixCommand[0] = factor;
  },

  reuseScaleYCommand(matrixCommand, factor) {
    matrixCommand[5] = factor;
  },

  reuseScaleZCommand(matrixCommand, factor) {
    matrixCommand[10] = factor;
  },

  reuseRotateYCommand: function(matrixCommand, amount) {
    matrixCommand[0] = Math.cos(amount);
    matrixCommand[2] = Math.sin(amount);
    matrixCommand[8] = Math.sin(-amount);
    matrixCommand[10] = Math.cos(amount);
  },

  createRotateZ: function(radians) {
    var mat = MatrixMath.createIdentityMatrix();
    MatrixMath.reuseRotateZCommand(mat, radians);
    return mat;
  },

  // http://www.w3.org/TR/css3-transforms/#recomposing-to-a-2d-matrix
  reuseRotateZCommand: function(matrixCommand, radians) {
    matrixCommand[0] = Math.cos(radians);
    matrixCommand[1] = Math.sin(radians);
    matrixCommand[4] = -Math.sin(radians);
    matrixCommand[5] = Math.cos(radians);
  },

  multiplyInto: function(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
      a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
      a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
      a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
  }

};

module.exports = MatrixMath;
