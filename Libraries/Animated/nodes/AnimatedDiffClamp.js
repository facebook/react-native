/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const AnimatedInterpolation = require('./AnimatedInterpolation');
const AnimatedNode = require('./AnimatedNode');
const AnimatedWithChildren = require('./AnimatedWithChildren');

import type {InterpolationConfigType} from './AnimatedInterpolation';
import type {PlatformConfig} from '../AnimatedPlatformConfig';

class AnimatedDiffClamp extends AnimatedWithChildren {
  _a: AnimatedNode;
  _min: number;
  _max: number;
  _value: number;
  _lastValue: number;

  constructor(a: AnimatedNode, min: number, max: number) {
    super();

    this._a = a;
    this._min = min;
    this._max = max;
    this._value = this._lastValue = this._a.__getValue();
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this._a.__makeNative(platformConfig);
    super.__makeNative(platformConfig);
  }

  interpolate<OutputT: number | string>(
    config: InterpolationConfigType<OutputT>,
  ): AnimatedInterpolation<OutputT> {
    return new AnimatedInterpolation(this, config);
  }

  __getValue(): number {
    const value = this._a.__getValue();
    const diff = value - this._lastValue;
    this._lastValue = value;
    this._value = Math.min(Math.max(this._value + diff, this._min), this._max);
    return this._value;
  }

  __attach(): void {
    this._a.__addChild(this);
  }

  __detach(): void {
    this._a.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'diffclamp',
      input: this._a.__getNativeTag(),
      min: this._min,
      max: this._max,
    };
  }
}

module.exports = AnimatedDiffClamp;
