/**
 * Copyright (c) 2015-present, Facebook, Inc.
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

import type {InterpolationConfigType} from './AnimatedInterpolation';

class AnimatedDivision extends AnimatedWithChildren {
  _a: AnimatedNode;
  _b: AnimatedNode;

  constructor(a: AnimatedNode | number, b: AnimatedNode | number) {
    super();
    this._a = typeof a === 'number' ? new AnimatedValue(a) : a;
    this._b = typeof b === 'number' ? new AnimatedValue(b) : b;
  }

  __makeNative() {
    this._a.__makeNative();
    this._b.__makeNative();
    super.__makeNative();
  }

  __getValue(): number {
    const a = this._a.__getValue();
    const b = this._b.__getValue();
    if (b === 0) {
      console.error('Detected division by zero in AnimatedDivision');
    }
    return a / b;
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
      type: 'division',
      input: [this._a.__getNativeTag(), this._b.__getNativeTag()],
    };
  }
}

module.exports = AnimatedDivision;
