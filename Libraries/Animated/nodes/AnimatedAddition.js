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
const AnimatedValue = require('./AnimatedValue');
const AnimatedWithChildren = require('./AnimatedWithChildren');

import type {PlatformConfig} from '../AnimatedPlatformConfig';
import type {InterpolationConfigType} from './AnimatedInterpolation';

class AnimatedAddition extends AnimatedWithChildren {
  _a: AnimatedNode;
  _b: AnimatedNode;

  constructor(a: AnimatedNode | number, b: AnimatedNode | number) {
    super();
    this._a = typeof a === 'number' ? new AnimatedValue(a) : a;
    this._b = typeof b === 'number' ? new AnimatedValue(b) : b;
  }

  __makeNative(platformConfig: ?PlatformConfig) {
    this._a.__makeNative(platformConfig);
    this._b.__makeNative(platformConfig);
    super.__makeNative(platformConfig);
  }

  __getValue(): number {
    return this._a.__getValue() + this._b.__getValue();
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  __attach(): void {
    this._a.__addChild(this);
    this._b.__addChild(this);
  }

  __detach(): void {
    this._a.__removeChild(this);
    this._b.__removeChild(this);
    super.__detach();
  }

  __getNativeConfig(): any {
    return {
      type: 'addition',
      input: [this._a.__getNativeTag(), this._b.__getNativeTag()],
    };
  }
}

module.exports = AnimatedAddition;
