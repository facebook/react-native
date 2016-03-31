/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule processTransform
 * @flow
 */
'use strict';

var MatrixMath = require('MatrixMath');
var Platform = require('Platform');

var invariant = require('fbjs/lib/invariant');
var stringifySafe = require('stringifySafe');

/**
 * Generate a transform matrix based on the provided transforms, and use that
 * within the style object instead.
 *
 * This allows us to provide an API that is similar to CSS, where transforms may
 * be applied in an arbitrary order, and yet have a universal, singular
 * interface to native code.
 */
function processTransform(transform: Object): Object {
  var result = MatrixMath.createIdentityMatrix();

  transform.forEach(transformation => {
    var key = Object.keys(transformation)[0];
    var value = transformation[key];
    if (__DEV__) {
      _validateTransform(key, value, transformation);
    }

    switch (key) {
      case 'matrix':
        MatrixMath.multiplyInto(result, result, value);
        break;
      case 'perspective':
        _multiplyTransform(result, MatrixMath.reusePerspectiveCommand, [value]);
        break;
      case 'rotateX':
        _multiplyTransform(result, MatrixMath.reuseRotateXCommand, [_convertToRadians(value)]);
        break;
      case 'rotateY':
        _multiplyTransform(result, MatrixMath.reuseRotateYCommand, [_convertToRadians(value)]);
        break;
      case 'rotate':
      case 'rotateZ':
        _multiplyTransform(result, MatrixMath.reuseRotateZCommand, [_convertToRadians(value)]);
        break;
      case 'scale':
        _multiplyTransform(result, MatrixMath.reuseScaleCommand, [value]);
        break;
      case 'scaleX':
        _multiplyTransform(result, MatrixMath.reuseScaleXCommand, [value]);
        break;
      case 'scaleY':
        _multiplyTransform(result, MatrixMath.reuseScaleYCommand, [value]);
        break;
      case 'translate':
        _multiplyTransform(result, MatrixMath.reuseTranslate3dCommand, [value[0], value[1], value[2] || 0]);
        break;
      case 'translateX':
        _multiplyTransform(result, MatrixMath.reuseTranslate2dCommand, [value, 0]);
        break;
      case 'translateY':
        _multiplyTransform(result, MatrixMath.reuseTranslate2dCommand, [0, value]);
        break;
      case 'skewX':
        _multiplyTransform(result, MatrixMath.reuseSkewXCommand, [_convertToRadians(value)]);
        break;
      case 'skewY':
        _multiplyTransform(result, MatrixMath.reuseSkewYCommand, [_convertToRadians(value)]);
        break;
      default:
        throw new Error('Invalid transform name: ' + key);
    }
  });

  // Android does not support the direct application of a transform matrix to
  // a view, so we need to decompose the result matrix into transforms that can
  // get applied in the specific order of (1) translate (2) scale (3) rotate.
  // Once we can directly apply a matrix, we can remove this decomposition.
  if (Platform.OS === 'android') {
    return MatrixMath.decomposeMatrix(result);
  }
  return result;
}

/**
 * Performs a destructive operation on a transform matrix.
 */
function _multiplyTransform(
  result: Array<number>,
  matrixMathFunction: Function,
  args: Array<number>
): void {
  var matrixToApply = MatrixMath.createIdentityMatrix();
  var argsWithIdentity = [matrixToApply].concat(args);
  matrixMathFunction.apply(this, argsWithIdentity);
  MatrixMath.multiplyInto(result, result, matrixToApply);
}

/**
 * Parses a string like '0.5rad' or '60deg' into radians expressed in a float.
 * Note that validation on the string is done in `_validateTransform()`.
 */
function _convertToRadians(value: string): number {
  var floatValue = parseFloat(value, 10);
  return value.indexOf('rad') > -1 ? floatValue : floatValue * Math.PI / 180;
}

function _validateTransform(key, value, transformation) {
  invariant(
    !value.getValue,
    'You passed an Animated.Value to a normal component. ' +
    'You need to wrap that component in an Animated. For example, ' +
    'replace <View /> by <Animated.View />.'
  );

  var multivalueTransforms = [
    'matrix',
    'translate',
  ];
  if (multivalueTransforms.indexOf(key) !== -1) {
    invariant(
      Array.isArray(value),
      'Transform with key of %s must have an array as the value: %s',
      key,
      stringifySafe(transformation),
    );
  }
  switch (key) {
    case 'matrix':
      invariant(
        value.length === 9 || value.length === 16,
        'Matrix transform must have a length of 9 (2d) or 16 (3d). ' +
          'Provided matrix has a length of %s: %s',
        value.length,
        stringifySafe(transformation),
      );
      break;
    case 'translate':
      break;
    case 'rotateX':
    case 'rotateY':
    case 'rotateZ':
    case 'rotate':
    case 'skewX':
    case 'skewY':
      invariant(
        typeof value === 'string',
        'Transform with key of "%s" must be a string: %s',
        key,
        stringifySafe(transformation),
      );
      invariant(
        value.indexOf('deg') > -1 || value.indexOf('rad') > -1,
        'Rotate transform must be expressed in degrees (deg) or radians ' +
          '(rad): %s',
        stringifySafe(transformation),
      );
      break;
    case 'perspective':
      invariant(
        typeof value === 'number',
        'Transform with key of "%s" must be a number: %s',
        key,
        stringifySafe(transformation),
      );
      invariant(
        value !== 0,
        'Transform with key of "%s" cannot be zero: %s',
        key,
        stringifySafe(transformation),
      );
      break;
    default:
      invariant(
        typeof value === 'number',
        'Transform with key of "%s" must be a number: %s',
        key,
        stringifySafe(transformation),
      );
  }
}

module.exports = processTransform;
