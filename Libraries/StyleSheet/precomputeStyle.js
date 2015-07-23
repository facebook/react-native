/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule precomputeStyle
 * @flow
 */
'use strict';

var MatrixMath = require('MatrixMath');
var Platform = require('Platform');

var deepFreezeAndThrowOnMutationInDev = require('deepFreezeAndThrowOnMutationInDev');
var invariant = require('invariant');
var stringifySafe = require('stringifySafe');

/**
 * This method provides a hook where flattened styles may be precomputed or
 * otherwise prepared to become better input data for native code.
 */
function precomputeStyle(style: ?Object): ?Object {
  if (!style || !style.transform) {
    return style;
  }
  invariant(
    !style.transformMatrix,
    'transformMatrix and transform styles cannot be used on the same component'
  );
  var newStyle = _precomputeTransforms({...style});
  deepFreezeAndThrowOnMutationInDev(newStyle);
  return newStyle;
}

/**
 * Generate a transform matrix based on the provided transforms, and use that
 * within the style object instead.
 *
 * This allows us to provide an API that is similar to CSS, where transforms may
 * be applied in an arbitrary order, and yet have a universal, singular
 * interface to native code.
 */
function _precomputeTransforms(style: Object): Object {
  var {transform, transformOrigin} = style;
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
      default:
        throw new Error('Invalid transform name: ' + key);
    }
  });

  if (transformOrigin) {
    // adjusts the `result` transform matrix to be applied from
    // the corresponding `transformOrigin`
    _applyTransformOrigin(result, transformOrigin);
  }

  // Android does not support the direct application of a transform matrix to
  // a view, so we need to decompose the result matrix into transforms that can
  // get applied in the specific order of (1) translate (2) scale (3) rotate.
  // Once we can directly apply a matrix, we can remove this decomposition.
  if (Platform.OS === 'android') {
    return {
      ...style,
      transformMatrix: result,
      decomposedMatrix: MatrixMath.decomposeMatrix(result),
    };
  }
  return {
    ...style,
    transformMatrix: result,
  };
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
 * Takes a transform matrix and an origin, and applies a transformation to
 * the matrix to change the transform origin. Mutates the passed in matrix.
 */
function _applyTransformOrigin(
  matrix: Array<number>,
  origin: Object
): void {
  origin = _normalizeOrigin(origin);
  var translate = MatrixMath.createIdentityMatrix();
  var untranslate = MatrixMath.createIdentityMatrix();
  MatrixMath.reuseTranslate3dCommand(
    translate,
    origin.x,
    origin.y,
    origin.z
  );
  MatrixMath.reuseTranslate3dCommand(
    untranslate,
    -origin.x,
    -origin.y,
    -origin.z
  );
  MatrixMath.multiplyInto(matrix, translate, matrix);
  MatrixMath.multiplyInto(matrix, matrix, untranslate);
}

function _normalizeOrigin(input: Object): Object {
  var output = { x: 0, y: 0, z: 0 };

  if (typeof input === 'string') {
    // user is using string short-hand.
  } else if (typeof input === 'object') {
    if (input.x) {
      invariant(
        typeof input.x === 'number',
        'transformOrigin expects a number for x'
      );
      output.x = input.x;
    }
    if (input.y) {
      invariant(
          typeof input.y === 'number',
          'transformOrigin expects a number for y'
      );
      output.y = input.y;
    }
    if (input.z) {
      invariant(
          typeof input.z === 'number',
          'transformOrigin expects a number for z'
      );
      output.z = input.z;
    }
  } else {
    invariant(
      false,
      'transformOrigin should be a string or an object'
    );
  }

  return output;
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
    default:
      invariant(
        typeof value === 'number',
        'Transform with key of "%s" must be a number: %s',
        key,
        stringifySafe(transformation),
      );
  }
}

module.exports = precomputeStyle;
