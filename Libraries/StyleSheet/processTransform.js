/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const MatrixMath = require('../Utilities/MatrixMath');
const Platform = require('../Utilities/Platform');

const invariant = require('invariant');
const stringifySafe = require('../Utilities/stringifySafe').default;

/**
 * Generate a transform matrix based on the provided transforms, and use that
 * within the style object instead.
 *
 * This allows us to provide an API that is similar to CSS, where transforms may
 * be applied in an arbitrary order, and yet have a universal, singular
 * interface to native code.
 */
function processTransform(
  transform: Array<Object>,
): Array<Object> | Array<number> {
  if (__DEV__) {
    _validateTransforms(transform);
  }

  // Android & iOS implementations of transform property accept the list of
  // transform properties as opposed to a transform Matrix. This is necessary
  // to control transform property updates completely on the native thread.
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return transform;
  }

  const result = MatrixMath.createIdentityMatrix();

  transform.forEach(transformation => {
    const key = Object.keys(transformation)[0];
    const value = transformation[key];

    switch (key) {
      case 'matrix':
        MatrixMath.multiplyInto(result, result, value);
        break;
      case 'perspective':
        _multiplyTransform(result, MatrixMath.reusePerspectiveCommand, [value]);
        break;
      case 'rotateX':
        _multiplyTransform(result, MatrixMath.reuseRotateXCommand, [
          _convertToRadians(value),
        ]);
        break;
      case 'rotateY':
        _multiplyTransform(result, MatrixMath.reuseRotateYCommand, [
          _convertToRadians(value),
        ]);
        break;
      case 'rotate':
      case 'rotateZ':
        _multiplyTransform(result, MatrixMath.reuseRotateZCommand, [
          _convertToRadians(value),
        ]);
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
        _multiplyTransform(result, MatrixMath.reuseTranslate3dCommand, [
          value[0],
          value[1],
          value[2] || 0,
        ]);
        break;
      case 'translateX':
        _multiplyTransform(result, MatrixMath.reuseTranslate2dCommand, [
          value,
          0,
        ]);
        break;
      case 'translateY':
        _multiplyTransform(result, MatrixMath.reuseTranslate2dCommand, [
          0,
          value,
        ]);
        break;
      case 'skewX':
        _multiplyTransform(result, MatrixMath.reuseSkewXCommand, [
          _convertToRadians(value),
        ]);
        break;
      case 'skewY':
        _multiplyTransform(result, MatrixMath.reuseSkewYCommand, [
          _convertToRadians(value),
        ]);
        break;
      default:
        throw new Error('Invalid transform name: ' + key);
    }
  });

  return result;
}

/**
 * Performs a destructive operation on a transform matrix.
 */
function _multiplyTransform(
  result: Array<number>,
  matrixMathFunction: Function,
  args: Array<number>,
): void {
  const matrixToApply = MatrixMath.createIdentityMatrix();
  const argsWithIdentity = [matrixToApply].concat(args);
  matrixMathFunction.apply(this, argsWithIdentity);
  MatrixMath.multiplyInto(result, result, matrixToApply);
}

/**
 * Parses a string like '0.5rad' or '60deg' into radians expressed in a float.
 * Note that validation on the string is done in `_validateTransform()`.
 */
function _convertToRadians(value: string): number {
  const floatValue = parseFloat(value);
  return value.indexOf('rad') > -1 ? floatValue : (floatValue * Math.PI) / 180;
}

function _validateTransforms(transform: Array<Object>): void {
  transform.forEach(transformation => {
    const keys = Object.keys(transformation);
    invariant(
      keys.length === 1,
      'You must specify exactly one property per transform object. Passed properties: %s',
      stringifySafe(transformation),
    );
    const key = keys[0];
    const value = transformation[key];
    _validateTransform(key, value, transformation);
  });
}

function _validateTransform(key, value, transformation) {
  invariant(
    !value.getValue,
    'You passed an Animated.Value to a normal component. ' +
      'You need to wrap that component in an Animated. For example, ' +
      'replace <View /> by <Animated.View />.',
  );

  const multivalueTransforms = ['matrix', 'translate'];
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
        /* $FlowFixMe[prop-missing] (>=0.84.0 site=react_native_fb) This
         * comment suppresses an error found when Flow v0.84 was deployed. To
         * see the error, delete this comment and run Flow. */
        value.length,
        stringifySafe(transformation),
      );
      break;
    case 'translate':
      invariant(
        value.length === 2 || value.length === 3,
        'Transform with key translate must be an array of length 2 or 3, found %s: %s',
        /* $FlowFixMe[prop-missing] (>=0.84.0 site=react_native_fb) This
         * comment suppresses an error found when Flow v0.84 was deployed. To
         * see the error, delete this comment and run Flow. */
        value.length,
        stringifySafe(transformation),
      );
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
    case 'translateX':
    case 'translateY':
    case 'scale':
    case 'scaleX':
    case 'scaleY':
      invariant(
        typeof value === 'number',
        'Transform with key of "%s" must be a number: %s',
        key,
        stringifySafe(transformation),
      );
      break;
    default:
      invariant(
        false,
        'Invalid transform %s: %s',
        key,
        stringifySafe(transformation),
      );
  }
}

module.exports = processTransform;
