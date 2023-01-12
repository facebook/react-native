/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/* eslint no-bitwise: 0 */

'use strict';

import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type AnimatedNode from './AnimatedNode';

import normalizeColor from '../../StyleSheet/normalizeColor';
import processColor from '../../StyleSheet/processColor';
import Easing from '../Easing';
import NativeAnimatedHelper from '../NativeAnimatedHelper';
import AnimatedWithChildren from './AnimatedWithChildren';
import invariant from 'invariant';

type ExtrapolateType = 'extend' | 'identity' | 'clamp';

export type InterpolationConfigType<OutputT: number | string> = $ReadOnly<{
  inputRange: $ReadOnlyArray<number>,
  outputRange: $ReadOnlyArray<OutputT>,
  easing?: (input: number) => number,
  extrapolate?: ExtrapolateType,
  extrapolateLeft?: ExtrapolateType,
  extrapolateRight?: ExtrapolateType,
}>;

/**
 * Very handy helper to map input ranges to output ranges with an easing
 * function and custom behavior outside of the ranges.
 */
function createNumericInterpolation(
  config: InterpolationConfigType<number>,
): (input: number) => number {
  const outputRange: $ReadOnlyArray<number> = (config.outputRange: any);
  const inputRange = config.inputRange;

  const easing = config.easing || Easing.linear;

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
    return (interpolate(
      input,
      inputRange[range],
      inputRange[range + 1],
      outputRange[range],
      outputRange[range + 1],
      easing,
      extrapolateLeft,
      extrapolateRight,
    ): any);
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

const numericComponentRegex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

// Maps string inputs an RGBA color or an array of numeric components
function mapStringToNumericComponents(
  input: string,
):
  | {isColor: true, components: [number, number, number, number]}
  | {isColor: false, components: $ReadOnlyArray<number | string>} {
  let normalizedColor = normalizeColor(input);
  invariant(
    normalizedColor == null || typeof normalizedColor !== 'object',
    'PlatformColors are not supported',
  );

  if (typeof normalizedColor === 'number') {
    normalizedColor = normalizedColor || 0;
    const r = (normalizedColor & 0xff000000) >>> 24;
    const g = (normalizedColor & 0x00ff0000) >>> 16;
    const b = (normalizedColor & 0x0000ff00) >>> 8;
    const a = (normalizedColor & 0x000000ff) / 255;
    return {isColor: true, components: [r, g, b, a]};
  } else {
    const components: Array<string | number> = [];
    let lastMatchEnd = 0;
    let match: RegExp$matchResult;
    while ((match = (numericComponentRegex.exec(input): any)) != null) {
      if (match.index > lastMatchEnd) {
        components.push(input.substring(lastMatchEnd, match.index));
      }
      components.push(parseFloat(match[0]));
      lastMatchEnd = match.index + match[0].length;
    }
    invariant(
      components.length > 0,
      'outputRange must contain color or value with numeric component',
    );
    if (lastMatchEnd < input.length) {
      components.push(input.substring(lastMatchEnd, input.length));
    }
    return {isColor: false, components};
  }
}

/**
 * Supports string shapes by extracting numbers so new values can be computed,
 * and recombines those values into new strings of the same shape.  Supports
 * things like:
 *
 *   rgba(123, 42, 99, 0.36) // colors
 *   -45deg                  // values with units
 */
function createStringInterpolation(
  config: InterpolationConfigType<string>,
): (input: number) => string {
  invariant(config.outputRange.length >= 2, 'Bad output range');
  const outputRange = config.outputRange.map(mapStringToNumericComponents);

  const isColor = outputRange[0].isColor;
  if (__DEV__) {
    invariant(
      outputRange.every(output => output.isColor === isColor),
      'All elements of output range should either be a color or a string with numeric components',
    );
    const firstOutput = outputRange[0].components;
    invariant(
      outputRange.every(
        output => output.components.length === firstOutput.length,
      ),
      'All elements of output range should have the same number of components',
    );
    invariant(
      outputRange.every(output =>
        output.components.every(
          (component, i) =>
            // $FlowIgnoreMe[invalid-compare]
            typeof component === 'number' || component === firstOutput[i],
        ),
      ),
      'All elements of output range should have the same non-numeric components',
    );
  }

  const numericComponents: $ReadOnlyArray<$ReadOnlyArray<number>> =
    outputRange.map(output =>
      isColor
        ? // $FlowIgnoreMe[incompatible-call]
          output.components
        : // $FlowIgnoreMe[incompatible-call]
          output.components.filter(c => typeof c === 'number'),
    );
  const interpolations = numericComponents[0].map((_, i) =>
    createNumericInterpolation({
      ...config,
      outputRange: numericComponents.map(components => components[i]),
    }),
  );
  if (!isColor) {
    return input => {
      const values = interpolations.map(interpolation => interpolation(input));
      let i = 0;
      return outputRange[0].components
        .map(c => (typeof c === 'number' ? values[i++] : c))
        .join('');
    };
  } else {
    return input => {
      const result = interpolations.map((interpolation, i) => {
        const value = interpolation(input);
        // rgba requires that the r,g,b are integers.... so we want to round them, but we *dont* want to
        // round the opacity (4th column).
        return i < 3 ? Math.round(value) : Math.round(value * 1000) / 1000;
      });
      return `rgba(${result[0]}, ${result[1]}, ${result[2]}, ${result[3]})`;
    };
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

function checkValidRanges<OutputT: number | string>(
  inputRange: $ReadOnlyArray<number>,
  outputRange: $ReadOnlyArray<OutputT>,
) {
  checkInfiniteRange('outputRange', outputRange);
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
}

function checkValidInputRange(arr: $ReadOnlyArray<number>) {
  invariant(arr.length >= 2, 'inputRange must have at least 2 elements');
  const message =
    'inputRange must be monotonically non-decreasing ' + String(arr);
  for (let i = 1; i < arr.length; ++i) {
    invariant(arr[i] >= arr[i - 1], message);
  }
}

function checkInfiniteRange<OutputT: number | string>(
  name: string,
  arr: $ReadOnlyArray<OutputT>,
) {
  invariant(arr.length >= 2, name + ' must have at least 2 elements');
  invariant(
    arr.length !== 2 || arr[0] !== -Infinity || arr[1] !== Infinity,
    /* $FlowFixMe[incompatible-type] (>=0.13.0) - In the addition expression
     * below this comment, one or both of the operands may be something that
     * doesn't cleanly convert to a string, like undefined, null, and object,
     * etc. If you really mean this implicit string conversion, you can do
     * something like String(myThing) */
    name + 'cannot be ]-infinity;+infinity[ ' + arr,
  );
}

export default class AnimatedInterpolation<
  OutputT: number | string,
> extends AnimatedWithChildren {
  _parent: AnimatedNode;
  _config: InterpolationConfigType<OutputT>;
  _interpolation: ?(input: number) => OutputT;

  constructor(parent: AnimatedNode, config: InterpolationConfigType<OutputT>) {
    super();
    this._parent = parent;
    this._config = config;

    if (__DEV__) {
      checkValidRanges(config.inputRange, config.outputRange);

      // Create interpolation eagerly in dev, so we can signal errors faster
      // even when using the native driver
      this._getInterpolation();
    }
  }

  _getInterpolation(): number => OutputT {
    if (!this._interpolation) {
      const config = this._config;
      if (config.outputRange && typeof config.outputRange[0] === 'string') {
        this._interpolation = (createStringInterpolation((config: any)): any);
      } else {
        this._interpolation = (createNumericInterpolation((config: any)): any);
      }
    }
    return this._interpolation;
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this._parent.__makeNative(platformConfig);
    super.__makeNative(platformConfig);
  }

  __getValue(): OutputT {
    const parentValue: number = this._parent.__getValue();
    invariant(
      typeof parentValue === 'number',
      'Cannot interpolate an input which is not a number.',
    );
    return this._getInterpolation()(parentValue);
  }

  interpolate<NewOutputT: number | string>(
    config: InterpolationConfigType<NewOutputT>,
  ): AnimatedInterpolation<NewOutputT> {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._parent.__addChild(this);
  }

  __detach(): void {
    this._parent.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    if (__DEV__) {
      NativeAnimatedHelper.validateInterpolation(this._config);
    }

    // Only the `outputRange` can contain strings so we don't need to transform `inputRange` here
    let outputRange = this._config.outputRange;
    let outputType = null;
    if (typeof outputRange[0] === 'string') {
      // $FlowIgnoreMe[incompatible-cast]
      outputRange = ((outputRange: $ReadOnlyArray<string>).map(value => {
        const processedColor = processColor(value);
        if (typeof processedColor === 'number') {
          outputType = 'color';
          return processedColor;
        } else {
          return NativeAnimatedHelper.transformDataType(value);
        }
      }): any);
    }

    return {
      inputRange: this._config.inputRange,
      outputRange,
      outputType,
      extrapolateLeft:
        this._config.extrapolateLeft || this._config.extrapolate || 'extend',
      extrapolateRight:
        this._config.extrapolateRight || this._config.extrapolate || 'extend',
      type: 'interpolation',
    };
  }
}
