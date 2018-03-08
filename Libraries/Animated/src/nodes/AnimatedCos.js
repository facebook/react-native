/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule AnimatedSin
 * @flow
 * @format
 */
'use strict';

const AnimatedInterpolation = require('./AnimatedInterpolation');
const AnimatedNode = require('./AnimatedNode');
const AnimatedValue = require('./AnimatedValue');
const AnimatedWithChildren = require('./AnimatedWithChildren');

import type {InterpolationConfigType} from './AnimatedInterpolation';

class AnimatedCos extends AnimatedWithChildren {
  _a: AnimatedNode;

  constructor(a: AnimatedNode | number) {
    super();
    this._a = typeof a === 'number' ? new AnimatedValue(a) : a;
  }

  __makeNative() {
    this._a.__makeNative();
    super.__makeNative();
  }

  __getValue(): number {
    return Math.cos(this._a.__getValue());
  }

  interpolate(config: InterpolationConfigType): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
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
      type: 'cos',
      input: [this._a.__getNativeTag()],
    };
  }
}

module.exports = AnimatedCos;
