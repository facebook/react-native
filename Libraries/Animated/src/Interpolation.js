/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Interpolation
 * @flow
 */
'use strict';

var tinycolor = require('tinycolor');

// TODO(#7644673): fix this hack once github jest actually checks invariants
var invariant = function(condition, message) {
  if (!condition) {
    var error = new Error(message);
    (error: any).framesToPop = 1; // $FlowIssue
    throw error;
  }
};

type ExtrapolateType = 'extend' | 'identity' | 'clamp';

export type InterpolationConfigType = {
  inputRange: Array<number>;
  outputRange: (Array<number> | Array<string>);
  easing?: ((input: number) => number);
  extrapolate?: ExtrapolateType;
  extrapolateLeft?: ExtrapolateType;
  extrapolateRight?: ExtrapolateType;
};

var linear = (t) => t;

/**
 * Very handy helper to map input ranges to output ranges with an easing
 * function and custom behavior outside of the ranges.
 */
class Interpolation {
  static create(config: InterpolationConfigType): (input: number) => number | string {

    if (config.outputRange && typeof config.outputRange[0] === 'string') {
      return createInterpolationFromStringOutputRange(config);
    }

    var outputRange: Array<number> = (config.outputRange: any);
    checkInfiniteRange('outputRange', outputRange);

    var inputRange = config.inputRange;
    checkInfiniteRange('inputRange', inputRange);
    checkValidInputRange(inputRange);

    invariant(
      inputRange.length === outputRange.length,
      'inputRange (' + inputRange.length + ') and outputRange (' +
      outputRange.length + ') must have the same length'
    );

    var easing = config.easing || linear;

    var extrapolateLeft: ExtrapolateType = 'extend';
    if (config.extrapolateLeft !== undefined) {
      extrapolateLeft = config.extrapolateLeft;
    } else if (config.extrapolate !== undefined) {
      extrapolateLeft = config.extrapolate;
    }

    var extrapolateRight: ExtrapolateType = 'extend';
    if (config.extrapolateRight !== undefined) {
      extrapolateRight = config.extrapolateRight;
    } else if (config.extrapolate !== undefined) {
      extrapolateRight = config.extrapolate;
    }

    return (input) => {
      invariant(
        typeof input === 'number',
        'Cannot interpolation an input which is not a number'
      );

      var range = findRange(input, inputRange);
      return interpolate(
        input,
        inputRange[range],
        inputRange[range + 1],
        outputRange[range],
        outputRange[range + 1],
        easing,
        extrapolateLeft,
        extrapolateRight,
      );
    };
  }
}

function interpolate(
  input: number,
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number,
  easing: ((input: number) => number),
  extrapolateLeft: ExtrapolateType,
  extrapolateRight: ExtrapolateType,
) {
  var result = input;

  // Extrapolate
  if (result < inputMin) {
    if (extrapolateLeft === 'identity') {
      return result;
    } else if (extrapolateLeft === 'clamp') {
      result = inputMin;
    } else if (extrapolateLeft === 'extend') {
      // noop
    }
  }

  if (result > inputMax) {
    if (extrapolateRight === 'identity') {
      return result;
    } else if (extrapolateRight === 'clamp') {
      result = inputMax;
    } else if (extrapolateRight === 'extend') {
      // noop
    }
  }

  if (outputMin === outputMax) {
    return outputMin;
  }

  if (inputMin === inputMax) {
    if (input <= inputMin) {
      return outputMin;
    }
    return outputMax;
  }

  // Input Range
  if (inputMin === -Infinity) {
    result = -result;
  } else if (inputMax === Infinity) {
    result = result - inputMin;
  } else {
    result = (result - inputMin) / (inputMax - inputMin);
  }

  // Easing
  result = easing(result);

  // Output Range
  if (outputMin === -Infinity) {
    result = -result;
  } else if (outputMax === Infinity) {
    result = result + outputMin;
  } else {
    result = result * (outputMax - outputMin) + outputMin;
  }

  return result;
}

function colorToRgba(
  input: string
): string {
  var color = tinycolor(input);
  if (color.isValid()) {
    var {r, g, b, a} = color.toRgb();
    return `rgba(${r}, ${g}, ${b}, ${a === undefined ? 1 : a})`;
  } else {
    return input;
  }
}

var stringShapeRegex = /[0-9\.-]+/g;

/**
 * Supports string shapes by extracting numbers so new values can be computed,
 * and recombines those values into new strings of the same shape.  Supports
 * things like:
 *
 *   rgba(123, 42, 99, 0.36) // colors
 *   -45deg                  // values with units
 */
function createInterpolationFromStringOutputRange(
  config: InterpolationConfigType,
): (input: number) => string {
  var outputRange: Array<string> = (config.outputRange: any);
  invariant(outputRange.length >= 2, 'Bad output range');
  outputRange = outputRange.map(colorToRgba);
  checkPattern(outputRange);

  // ['rgba(0, 100, 200, 0)', 'rgba(50, 150, 250, 0.5)']
  // ->
  // [
  //   [0, 50],
  //   [100, 150],
  //   [200, 250],
  //   [0, 0.5],
  // ]
  /* $FlowFixMe(>=0.18.0): `outputRange[0].match()` can return `null`. Need to
   * guard against this possibility.
   */
  var outputRanges = outputRange[0].match(stringShapeRegex).map(() => []);
  outputRange.forEach(value => {
    /* $FlowFixMe(>=0.18.0): `value.match()` can return `null`. Need to guard
     * against this possibility.
     */
    value.match(stringShapeRegex).forEach((number, i) => {
      outputRanges[i].push(+number);
    });
  });

  /* $FlowFixMe(>=0.18.0): `outputRange[0].match()` can return `null`. Need to
   * guard against this possibility.
   */
  var interpolations = outputRange[0].match(stringShapeRegex).map((value, i) => {
    return Interpolation.create({
      ...config,
      outputRange: outputRanges[i],
    });
  });

  return (input) => {
    var i = 0;
    // 'rgba(0, 100, 200, 0)'
    // ->
    // 'rgba(${interpolations[0](input)}, ${interpolations[1](input)}, ...'
    return outputRange[0].replace(stringShapeRegex, () => {
      return String(interpolations[i++](input));
    });
  };
}

function checkPattern(arr: Array<string>) {
  var pattern = arr[0].replace(stringShapeRegex, '');
  for (var i = 1; i < arr.length; ++i) {
    invariant(
      pattern === arr[i].replace(stringShapeRegex, ''),
      'invalid pattern ' + arr[0] + ' and ' + arr[i],
    );
  }
}

function findRange(input: number, inputRange: Array<number>) {
  for (var i = 1; i < inputRange.length - 1; ++i) {
    if (inputRange[i] >= input) {
      break;
    }
  }
  return i - 1;
}

function checkValidInputRange(arr: Array<number>) {
  invariant(arr.length >= 2, 'inputRange must have at least 2 elements');
  for (var i = 1; i < arr.length; ++i) {
    invariant(
      arr[i] >= arr[i - 1],
      /* $FlowFixMe(>=0.13.0) - In the addition expression below this comment,
       * one or both of the operands may be something that doesn't cleanly
       * convert to a string, like undefined, null, and object, etc. If you really
       * mean this implicit string conversion, you can do something like
       * String(myThing)
       */
      'inputRange must be monotonically increasing ' + arr
    );
  }
}

function checkInfiniteRange(name: string, arr: Array<number>) {
  invariant(arr.length >= 2, name + ' must have at least 2 elements');
  invariant(
    arr.length !== 2 || arr[0] !== -Infinity || arr[1] !== Infinity,
    /* $FlowFixMe(>=0.13.0) - In the addition expression below this comment,
     * one or both of the operands may be something that doesn't cleanly convert
     * to a string, like undefined, null, and object, etc. If you really mean
     * this implicit string conversion, you can do something like
     * String(myThing)
     */
    name + 'cannot be ]-infinity;+infinity[ ' + arr
  );
}

module.exports = Interpolation;
