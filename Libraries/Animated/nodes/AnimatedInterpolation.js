/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/* eslint no-bitwise: 0 */

'use strict';

const AnimatedNode = require('./AnimatedNode');
const AnimatedWithChildren = require('./AnimatedWithChildren');
const NativeAnimatedHelper = require('../NativeAnimatedHelper');

const invariant = require('invariant');
const normalizeColor = require('../../StyleSheet/normalizeColor');

type ExtrapolateType = 'extend' | 'identity' | 'clamp';

export type InterpolationConfigType = {
  inputRange: $ReadOnlyArray<number>,
  outputRange: $ReadOnlyArray<number> | $ReadOnlyArray<string>,
  easing?: (input: number) => number,
  extrapolate?: ExtrapolateType,
  extrapolateLeft?: ExtrapolateType,
  extrapolateRight?: ExtrapolateType,
};

const linear = t => t;

/**
 * Very handy helper to map input ranges to output ranges with an easing
 * function and custom behavior outside of the ranges.
 */
function createInterpolation(
  config: InterpolationConfigType,
): (input: number) => number | string {
  if (config.outputRange && typeof config.outputRange[0] === 'string') {
    return createInterpolationFromStringOutputRange(config);
  }

  const outputRange: Array<number> = (config.outputRange: any);
  checkInfiniteRange('outputRange', outputRange);

  const inputRange = config.inputRange;
  checkInfiniteRange('inputRange', inputRange);
  checkValidInputRange(inputRange);

  invariant(
    inputRange.length === outputRange.length,
    'inputRange (' +
      inputRange.length +
      ') and outputRange (' +
      outputRange.length +
      ') must have the same length',
  );

  const easing = config.easing || linear;

  let extrapolateLeft: ExtrapolateType = 'extend';
  if (config.extrapolateLeft !== undefined) {
    extrapolateLeft = config.extrapolateLeft;
  } else if (config.extrapolate !== undefined) {
    extrapolateLeft = config.extrapolate;
  }

  let extrapolateRight: ExtrapolateType = 'extend';
  if (config.extrapolateRight !== undefined) {
    extrapolateRight = config.extrapolateRight;
  } else if (config.extrapolate !== undefined) {
    extrapolateRight = config.extrapolate;
  }

  return input => {
    invariant(
      typeof input === 'number',
      'Cannot interpolation an input which is not a number',
    );

    const range = findRange(input, inputRange);
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

function interpolate(
  input: number,
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number,
  easing: (input: number) => number,
  extrapolateLeft: ExtrapolateType,
  extrapolateRight: ExtrapolateType,
) {
  let result = input;

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

function colorToRgba(input: string): string {
  let normalizedColor = normalizeColor(input);
  if (normalizedColor === null || typeof normalizedColor !== 'number') {
    return input;
  }

  normalizedColor = normalizedColor || 0;

  const r = (normalizedColor & 0xff000000) >>> 24;
  const g = (normalizedColor & 0x00ff0000) >>> 16;
  const b = (normalizedColor & 0x0000ff00) >>> 8;
  const a = (normalizedColor & 0x000000ff) / 255;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const stringShapeRegex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

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
  let outputRange: Array<string> = (config.outputRange: any);
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
  const outputRanges = outputRange[0].match(stringShapeRegex).map(() => []);
  outputRange.forEach(value => {
    /* $FlowFixMe(>=0.18.0): `value.match()` can return `null`. Need to guard
     * against this possibility.
     */
    value.match(stringShapeRegex).forEach((number, i) => {
      outputRanges[i].push(+number);
    });
  });

  const interpolations = outputRange[0]
    .match(stringShapeRegex)
    /* $FlowFixMe(>=0.18.0): `outputRange[0].match()` can return `null`. Need
     * to guard against this possibility. */
    .map((value, i) => {
      return createInterpolation({
        ...config,
        outputRange: outputRanges[i],
      });
    });

  // rgba requires that the r,g,b are integers.... so we want to round them, but we *dont* want to
  // round the opacity (4th column).
  const shouldRound = isRgbOrRgba(outputRange[0]);

  return input => {
    let i = 0;
    // 'rgba(0, 100, 200, 0)'
    // ->
    // 'rgba(${interpolations[0](input)}, ${interpolations[1](input)}, ...'
    return outputRange[0].replace(stringShapeRegex, () => {
      let val = +interpolations[i++](input);
      if (shouldRound) {
        val = i < 4 ? Math.round(val) : Math.round(val * 1000) / 1000;
      }
      return String(val);
    });
  };
}

function isRgbOrRgba(range) {
  return typeof range === 'string' && range.startsWith('rgb');
}

function checkPattern(arr: $ReadOnlyArray<string>) {
  const pattern = arr[0].replace(stringShapeRegex, '');
  for (let i = 1; i < arr.length; ++i) {
    invariant(
      pattern === arr[i].replace(stringShapeRegex, ''),
      'invalid pattern ' + arr[0] + ' and ' + arr[i],
    );
  }
}

function findRange(input: number, inputRange: $ReadOnlyArray<number>) {
  let i;
  for (i = 1; i < inputRange.length - 1; ++i) {
    if (inputRange[i] >= input) {
      break;
    }
  }
  return i - 1;
}

function checkValidInputRange(arr: $ReadOnlyArray<number>) {
  invariant(arr.length >= 2, 'inputRange must have at least 2 elements');
  for (let i = 1; i < arr.length; ++i) {
    invariant(
      arr[i] >= arr[i - 1],
      /* $FlowFixMe(>=0.13.0) - In the addition expression below this comment,
       * one or both of the operands may be something that doesn't cleanly
       * convert to a string, like undefined, null, and object, etc. If you really
       * mean this implicit string conversion, you can do something like
       * String(myThing)
       */
      'inputRange must be monotonically non-decreasing ' + arr,
    );
  }
}

function checkInfiniteRange(name: string, arr: $ReadOnlyArray<number>) {
  invariant(arr.length >= 2, name + ' must have at least 2 elements');
  invariant(
    arr.length !== 2 || arr[0] !== -Infinity || arr[1] !== Infinity,
    /* $FlowFixMe(>=0.13.0) - In the addition expression below this comment,
     * one or both of the operands may be something that doesn't cleanly convert
     * to a string, like undefined, null, and object, etc. If you really mean
     * this implicit string conversion, you can do something like
     * String(myThing)
     */
    name + 'cannot be ]-infinity;+infinity[ ' + arr,
  );
}

class AnimatedInterpolation extends AnimatedWithChildren {
  // Export for testing.
  static __createInterpolation: (
    config: InterpolationConfigType,
  ) => (input: number) => number | string = createInterpolation;

  _parent: AnimatedNode;
  _config: InterpolationConfigType;
  _interpolation: (input: number) => number | string;

  constructor(parent: AnimatedNode, config: InterpolationConfigType) {
    super();
    this._parent = parent;
    this._config = config;
    this._interpolation = createInterpolation(config);
  }

  __makeNative() {
    this._parent.__makeNative();
    super.__makeNative();
  }

  __getValue(): number | string {
    const parentValue: number = this._parent.__getValue();
    invariant(
      typeof parentValue === 'number',
      'Cannot interpolate an input which is not a number.',
    );
    return this._interpolation(parentValue);
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._parent.__addChild(this);
  }

  __detach(): void {
    this._parent.__removeChild(this);
    super.__detach();
  }

  __transformDataType(range: Array<any>): Array<any> {
    return range.map(NativeAnimatedHelper.transformDataType);
  }

  __getNativeConfig(): any {
    if (__DEV__) {
      NativeAnimatedHelper.validateInterpolation(this._config);
    }

    return {
      inputRange: this._config.inputRange,
      // Only the `outputRange` can contain strings so we don't need to transform `inputRange` here
      /* $FlowFixMe(>=0.38.0) - Flow error detected during the deployment of
       * v0.38.0. To see the error, remove this comment and run flow */
      outputRange: this.__transformDataType(this._config.outputRange),
      extrapolateLeft:
        this._config.extrapolateLeft || this._config.extrapolate || 'extend',
      extrapolateRight:
        this._config.extrapolateRight || this._config.extrapolate || 'extend',
      type: 'interpolation',
    };
  }
}

module.exports = AnimatedInterpolation;
